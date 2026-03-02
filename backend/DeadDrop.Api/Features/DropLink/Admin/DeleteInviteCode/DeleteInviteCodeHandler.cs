using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using StashPup.Core.Interfaces;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Admin.DeleteInviteCode;

public class DeleteInviteCodeHandler
{
    private readonly DropLinkDbContext _db;
    private readonly IFileStorage _fileStorage;
    private readonly ILogger<DeleteInviteCodeHandler> _logger;

    public DeleteInviteCodeHandler(DropLinkDbContext db, IFileStorage fileStorage, ILogger<DeleteInviteCodeHandler> logger)
    {
        _db = db;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var invite = await _db.InviteCodes
            .Include(i => i.Drops)
                .ThenInclude(d => d.DownloadEvents)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invite is null)
            throw new NotFoundError(DropLinkErrorMessages.InviteCodeNotFound);

        // Delete files from S3 and remove drops (Restrict FK, so must delete manually)
        foreach (var drop in invite.Drops)
        {
            if (drop.StorageFileId.HasValue)
            {
                try
                {
                    await _fileStorage.DeleteAsync(drop.StorageFileId.Value);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete S3 file for drop {DropId}", drop.Id);
                }
            }

            _db.DownloadEvents.RemoveRange(drop.DownloadEvents);
            _db.Drops.Remove(drop);
        }

        _db.InviteCodes.Remove(invite);
        await _db.SaveChangesAsync();
    }
}
