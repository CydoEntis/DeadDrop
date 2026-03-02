using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using StashPup.Core.Interfaces;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Admin.DeleteDrop;

public class DeleteDropHandler
{
    private readonly DropLinkDbContext _db;
    private readonly IFileStorage _fileStorage;
    private readonly ILogger<DeleteDropHandler> _logger;

    public DeleteDropHandler(DropLinkDbContext db, IFileStorage fileStorage, ILogger<DeleteDropHandler> logger)
    {
        _db = db;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var drop = await _db.Drops
            .Include(d => d.DownloadEvents)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

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
        await _db.SaveChangesAsync();
    }
}
