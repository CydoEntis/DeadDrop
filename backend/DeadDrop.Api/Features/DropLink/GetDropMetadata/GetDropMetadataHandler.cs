using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.GetDropMetadata;

public class GetDropMetadataHandler
{
    private readonly DropLinkDbContext _db;

    public GetDropMetadataHandler(DropLinkDbContext db)
    {
        _db = db;
    }

    public async Task<DropMetadataResponse> ExecuteAsync(string publicId)
    {
        var drop = await _db.Drops
            .FirstOrDefaultAsync(d => d.PublicId == publicId);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (drop.Status == DropStatus.Deleted || drop.Status == DropStatus.Deleting)
            throw new NotFoundError(DropLinkErrorMessages.DropDeleted);

        if (drop.Status == DropStatus.Expired || drop.ExpiresAt < DateTime.UtcNow)
            throw new NotFoundError(DropLinkErrorMessages.DropExpired);

        if (drop.DeleteAfterDownloads > 0 && drop.DownloadCount >= drop.DeleteAfterDownloads)
            throw new NotFoundError(DropLinkErrorMessages.DownloadLimitReached);

        return new DropMetadataResponse(
            PublicId: drop.PublicId,
            Status: drop.Status.ToString(),
            OriginalFilename: drop.OriginalFilename,
            SizeBytes: drop.SizeBytes,
            ExpiresAt: drop.ExpiresAt,
            RequiresPassword: drop.PasswordHash is not null,
            DownloadCount: drop.DownloadCount,
            DeleteAfterDownloads: drop.DeleteAfterDownloads);
    }
}
