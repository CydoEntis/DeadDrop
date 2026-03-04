using Amazon.S3.Model;
using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Upload.Models;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.DropLink.Upload;

public class CompleteUploadHandler
{
    private readonly DropLinkDbContext _db;
    private readonly S3DirectService _s3;
    private readonly ILogger<CompleteUploadHandler> _logger;

    public CompleteUploadHandler(DropLinkDbContext db, S3DirectService s3, ILogger<CompleteUploadHandler> logger)
    {
        _db = db;
        _s3 = s3;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid dropId, CompleteUploadRequest request)
    {
        var drop = await _db.Drops
            .Include(d => d.InviteCode)
            .FirstOrDefaultAsync(d => d.Id == dropId);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (drop.Status != DropStatus.Uploading)
            throw new BadRequestError("Drop is not in uploading state");

        if (string.IsNullOrEmpty(drop.StoragePath))
            throw new BadRequestError("Upload not initiated");

        var parts = request.Parts
            .Select(p => new PartETag(p.PartNumber, p.ETag))
            .ToList();

        await _s3.CompleteMultipartUploadAsync(drop.StoragePath, request.UploadId, parts);

        var sizeBytes = await _s3.GetObjectSizeAsync(drop.StoragePath);

        drop.SizeBytes = sizeBytes;
        drop.Status = DropStatus.Ready;
        drop.ExpiresAt = DateTime.UtcNow.AddSeconds(drop.TtlSeconds);
        drop.S3UploadId = null;

        drop.InviteCode.UsedTotalBytes += sizeBytes;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Drop {PublicId} upload complete: {Size} bytes", drop.PublicId, sizeBytes);
    }
}
