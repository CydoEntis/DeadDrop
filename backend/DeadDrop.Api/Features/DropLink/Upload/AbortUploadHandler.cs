using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Upload.Models;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.DropLink.Upload;

public class AbortUploadHandler
{
    private readonly DropLinkDbContext _db;
    private readonly S3DirectService _s3;
    private readonly ILogger<AbortUploadHandler> _logger;

    public AbortUploadHandler(DropLinkDbContext db, S3DirectService s3, ILogger<AbortUploadHandler> logger)
    {
        _db = db;
        _s3 = s3;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid dropId, AbortUploadRequest request)
    {
        var drop = await _db.Drops.FirstOrDefaultAsync(d => d.Id == dropId);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (!string.IsNullOrEmpty(drop.StoragePath) && !string.IsNullOrEmpty(request.UploadId))
        {
            try
            {
                await _s3.AbortMultipartUploadAsync(drop.StoragePath, request.UploadId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to abort S3 multipart upload for drop {DropId}", dropId);
            }
        }

        drop.Status = DropStatus.Failed;
        drop.S3UploadId = null;
        await _db.SaveChangesAsync();
    }
}
