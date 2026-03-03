using ErrorHound.BuiltIn;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using StashPup.Core.Interfaces;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Infrastructure.Data;
using IResult = Microsoft.AspNetCore.Http.IResult;

namespace DeadDrop.Features.DropLink.Download;

public class DownloadDropHandler
{
    private readonly DropLinkDbContext _db;
    private readonly DownloadTokenStore _tokenStore;
    private readonly IFileStorage _fileStorage;
    private readonly ILogger<DownloadDropHandler> _logger;

    public DownloadDropHandler(DropLinkDbContext db, DownloadTokenStore tokenStore, IFileStorage fileStorage, ILogger<DownloadDropHandler> logger)
    {
        _db = db;
        _tokenStore = tokenStore;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task<IResult> ExecuteAsync(string publicId, string token, HttpContext context)
    {
        // Validate download token
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

        // Verify file exists in S3
        if (!drop.StorageFileId.HasValue)
        {
            _logger.LogError("Drop {PublicId} has no StorageFileId", publicId);
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);
        }

        var existsResult = await _fileStorage.ExistsAsync(drop.StorageFileId.Value);
        if (!existsResult.Success || !existsResult.Data)
        {
            _logger.LogError("Drop file not found in S3: {StorageFileId} for drop {PublicId}", drop.StorageFileId, publicId);
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);
        }

        // Record download event start
        var downloadEvent = new DownloadEvent
        {
            DropId = drop.Id,
            IpAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            UserAgent = context.Request.Headers.UserAgent.ToString()
        };
        _db.DownloadEvents.Add(downloadEvent);
        await _db.SaveChangesAsync();

        // Sanitize filename for Content-Disposition
        var safeFilename = drop.OriginalFilename
            .Replace("\"", "")
            .Replace("\r", "")
            .Replace("\n", "");

        // Set response headers
        context.Response.Headers["Content-Disposition"] = $"attachment; filename=\"{safeFilename}\"";
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.ContentType = drop.ContentType;

        if (drop.SizeBytes.HasValue)
            context.Response.ContentLength = drop.SizeBytes.Value;

        // Stream file from S3
        var streamResult = await _fileStorage.GetAsync(drop.StorageFileId.Value);
        if (!streamResult.Success)
        {
            _logger.LogError("Failed to get drop file from S3: {Error}", streamResult.ErrorMessage);
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);
        }

        var fileStream = streamResult.Data;
        var cancellationToken = context.RequestAborted;

        try
        {
            await fileStream.CopyToAsync(context.Response.Body, 81920, cancellationToken);
            await context.Response.Body.FlushAsync(cancellationToken);

            // Download completed successfully
            downloadEvent.CompletedAt = DateTime.UtcNow;
            downloadEvent.BytesSent = drop.SizeBytes ?? 0;
            downloadEvent.WasSuccess = true;

            drop.DownloadCount++;

            // Check if we should delete
            if (drop.DeleteAfterDownloads > 0 && drop.DownloadCount >= drop.DeleteAfterDownloads)
            {
                try
                {
                    await _fileStorage.DeleteAsync(drop.StorageFileId.Value);
                    drop.Status = DropStatus.Deleted;
                    _logger.LogInformation("Drop {PublicId} auto-deleted after {Count} downloads", publicId, drop.DownloadCount);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete drop file from S3: {StorageFileId}", drop.StorageFileId);
                    drop.Status = DropStatus.Deleting;
                }
            }

            await _db.SaveChangesAsync();
        }
        catch (OperationCanceledException)
        {
            // Client disconnected — do NOT count as successful
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
