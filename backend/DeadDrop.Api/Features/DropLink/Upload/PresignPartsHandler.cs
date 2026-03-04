using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Upload.Models;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.DropLink.Upload;

public class PresignPartsHandler
{
    private readonly DropLinkDbContext _db;
    private readonly S3DirectService _s3;

    public PresignPartsHandler(DropLinkDbContext db, S3DirectService s3)
    {
        _db = db;
        _s3 = s3;
    }

    public async Task<PresignPartsResponse> ExecuteAsync(Guid dropId, PresignPartsRequest request)
    {
        var drop = await _db.Drops.FirstOrDefaultAsync(d => d.Id == dropId);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (drop.Status != DropStatus.Uploading)
            throw new BadRequestError("Drop is not in uploading state");

        if (string.IsNullOrEmpty(drop.StoragePath) || string.IsNullOrEmpty(drop.S3UploadId))
            throw new BadRequestError("Upload not initiated");

        var parts = request.PartNumbers.Select(pn => new PresignedPart(
            pn,
            _s3.GeneratePresignedPartUrl(drop.StoragePath, request.UploadId, pn)
        )).ToArray();

        return new PresignPartsResponse(parts);
    }
}
