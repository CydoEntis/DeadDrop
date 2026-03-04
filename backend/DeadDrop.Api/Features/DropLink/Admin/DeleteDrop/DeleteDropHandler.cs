using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.DropLink.Admin.DeleteDrop;

public class DeleteDropHandler
{
    private readonly DropLinkDbContext _db;
    private readonly S3DirectService _s3;
    private readonly ILogger<DeleteDropHandler> _logger;

    public DeleteDropHandler(DropLinkDbContext db, S3DirectService s3, ILogger<DeleteDropHandler> logger)
    {
        _db = db;
        _s3 = s3;
        _logger = logger;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var drop = await _db.Drops
            .Include(d => d.DownloadEvents)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (!string.IsNullOrEmpty(drop.StoragePath))
        {
            try
            {
                await _s3.DeleteObjectAsync(drop.StoragePath);
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
