using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;
using IResult = Microsoft.AspNetCore.Http.IResult;

namespace DeadDrop.Features.DropLink.Download;

public class DownloadDropHandler
{
    private readonly DropLinkDbContext _db;
    private readonly DownloadTokenStore _tokenStore;
    private readonly S3DirectService _s3;
    private readonly ILogger<DownloadDropHandler> _logger;

    public DownloadDropHandler(DropLinkDbContext db, DownloadTokenStore tokenStore, S3DirectService s3, ILogger<DownloadDropHandler> logger)
    {
        _db = db;
        _tokenStore = tokenStore;
        _s3 = s3;
        _logger = logger;
    }

    public async Task<IResult> ExecuteAsync(string publicId, string token, HttpContext context)
    {
        var validatedPublicId = _tokenStore.ValidateToken(token);
        if (validatedPublicId is null || validatedPublicId != publicId)
            throw new BadRequestError(DropLinkErrorMessages.InvalidDownloadToken);

        var drop = await _db.Drops
            .FirstOrDefaultAsync(d => d.PublicId == publicId);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (drop.Status != DropStatus.Ready)
            throw new BadRequestError(DropLinkErrorMessages.DropNotReady);

        if (drop.ExpiresAt.HasValue && drop.ExpiresAt < DateTime.UtcNow)
            throw new NotFoundError(DropLinkErrorMessages.DropExpired);

        if (drop.DeleteAfterDownloads > 0 && drop.DownloadCount >= drop.DeleteAfterDownloads)
            throw new NotFoundError(DropLinkErrorMessages.DownloadLimitReached);

        if (string.IsNullOrEmpty(drop.StoragePath))
        {
            _logger.LogError("Drop {PublicId} has no StoragePath", publicId);
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);
        }

        if (!await _s3.ObjectExistsAsync(drop.StoragePath))
        {
            _logger.LogError("Drop file not found in S3: {StoragePath} for drop {PublicId}", drop.StoragePath, publicId);
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);
        }

        var downloadEvent = new DownloadEvent
        {
            DropId = drop.Id,
            IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            UserAgent = context.Request.Headers.UserAgent.ToString()
        };
        _db.DownloadEvents.Add(downloadEvent);
        await _db.SaveChangesAsync();

        var safeFilename = drop.OriginalFilename
            .Replace("\"", "")
            .Replace("\r", "")
            .Replace("\n", "");

        context.Response.Headers["Content-Disposition"] = $"attachment; filename=\"{safeFilename}\"";
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.ContentType = drop.ContentType;

        if (drop.SizeBytes.HasValue)
            context.Response.ContentLength = drop.SizeBytes.Value;

        var fileStream = await _s3.GetObjectStreamAsync(drop.StoragePath);
        var cancellationToken = context.RequestAborted;

        try
        {
            await fileStream.CopyToAsync(context.Response.Body, 81920, cancellationToken);
            await context.Response.Body.FlushAsync(cancellationToken);

            downloadEvent.CompletedAt = DateTime.UtcNow;
            downloadEvent.BytesSent = drop.SizeBytes ?? 0;
            downloadEvent.WasSuccess = true;

            drop.DownloadCount++;

            if (drop.DeleteAfterDownloads > 0 && drop.DownloadCount >= drop.DeleteAfterDownloads)
            {
                try
                {
                    await _s3.DeleteObjectAsync(drop.StoragePath);
                    drop.Status = DropStatus.Deleted;
                    _logger.LogInformation("Drop {PublicId} auto-deleted after {Count} downloads", publicId, drop.DownloadCount);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete drop file from S3: {StoragePath}", drop.StoragePath);
                    drop.Status = DropStatus.Deleting;
                }
            }

            await _db.SaveChangesAsync();
        }
        catch (OperationCanceledException)
        {
            downloadEvent.CompletedAt = DateTime.UtcNow;
            downloadEvent.WasSuccess = false;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Download cancelled by client for drop {PublicId}", publicId);
        }
        finally
        {
            await fileStream.DisposeAsync();
        }

        return Results.Empty;
    }
}
