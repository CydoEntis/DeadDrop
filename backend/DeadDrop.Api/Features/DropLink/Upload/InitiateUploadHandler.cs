using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Upload.Models;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.DropLink.Upload;

public class InitiateUploadHandler
{
    private readonly DropLinkDbContext _db;
    private readonly S3DirectService _s3;
    private const long PartSize = 50 * 1024 * 1024; // 50 MB

    public InitiateUploadHandler(DropLinkDbContext db, S3DirectService s3)
    {
        _db = db;
        _s3 = s3;
    }

    public async Task<InitiateUploadResponse> ExecuteAsync(Guid dropId)
    {
        var drop = await _db.Drops
            .Include(d => d.InviteCode)
            .FirstOrDefaultAsync(d => d.Id == dropId);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (drop.Status != DropStatus.Created)
            throw new BadRequestError("Drop is not in a valid state for upload");

        if (drop.InviteCode.IsRevoked)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeRevoked);

        var key = $"drops/{dropId}/{drop.OriginalFilename}";
        var uploadId = await _s3.InitiateMultipartUploadAsync(key, drop.ContentType);

        drop.Status = DropStatus.Uploading;
        drop.StoragePath = key;
        drop.S3UploadId = uploadId;
        await _db.SaveChangesAsync();

        return new InitiateUploadResponse(uploadId, key, PartSize);
    }
}
