using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StashPup.Core.Interfaces;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Cleanup;

public class DropCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DropCleanupService> _logger;
    private readonly DropLinkConfig _config;

    public DropCleanupService(
        IServiceProvider serviceProvider,
        ILogger<DropCleanupService> logger,
        IOptions<DropLinkConfig> config)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _config = config.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DropLink cleanup service started (interval: {Interval}m)", _config.CleanupIntervalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during DropLink cleanup");
            }

            await Task.Delay(TimeSpan.FromMinutes(_config.CleanupIntervalMinutes), stoppingToken);
        }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DropLinkDbContext>();
        var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStorage>();
        var now = DateTime.UtcNow;

        // 1. Expire drops past their TTL
        var expiredDrops = await db.Drops
            .Where(d => d.ExpiresAt < now && d.Status != DropStatus.Deleted && d.Status != DropStatus.Expired && d.Status != DropStatus.Failed)
            .ToListAsync(cancellationToken);

        foreach (var drop in expiredDrops)
        {
            try
            {
                if (drop.StorageFileId.HasValue)
                {
                    await fileStorage.DeleteAsync(drop.StorageFileId.Value, cancellationToken);
                }

                drop.Status = DropStatus.Expired;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to clean up expired drop {DropId}", drop.Id);
            }
        }

        if (expiredDrops.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Cleaned up {Count} expired drops", expiredDrops.Count);
        }

        // 2. Clean up abandoned uploads (created > 24h ago, still in Created/Uploading)
        var abandonedCutoff = now.AddHours(-DropLinkDefaults.AbandonedUploadHours);
        var abandonedDrops = await db.Drops
            .Where(d => d.CreatedAt < abandonedCutoff && (d.Status == DropStatus.Created || d.Status == DropStatus.Uploading))
            .ToListAsync(cancellationToken);

        foreach (var drop in abandonedDrops)
        {
            drop.Status = DropStatus.Failed;
        }

        if (abandonedDrops.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Marked {Count} abandoned uploads as failed", abandonedDrops.Count);
        }

        // 3. Clean up drops marked as Deleting (file deletion was attempted but may have failed)
        var deletingDrops = await db.Drops
            .Where(d => d.Status == DropStatus.Deleting)
            .ToListAsync(cancellationToken);

        foreach (var drop in deletingDrops)
        {
            try
            {
                if (drop.StorageFileId.HasValue)
                    await fileStorage.DeleteAsync(drop.StorageFileId.Value, cancellationToken);

                drop.Status = DropStatus.Deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to clean up deleting drop {DropId}", drop.Id);
            }
        }

        if (deletingDrops.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Cleaned up {Count} deleting drops", deletingDrops.Count);
        }

        // 4. Purge old download events
        var eventCutoff = now.AddDays(-DropLinkDefaults.DownloadEventRetentionDays);
        var purgedEvents = await db.DownloadEvents
            .Where(e => e.StartedAt < eventCutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if (purgedEvents > 0)
            _logger.LogInformation("Purged {Count} old download events", purgedEvents);

        // 5. Clean orphaned tus temp files (still local disk)
        CleanOrphanedTusFiles();
    }

    private void CleanOrphanedTusFiles()
    {
        try
        {
            if (!Directory.Exists(_config.TusDir))
                return;

            var cutoff = DateTime.UtcNow.AddHours(-DropLinkDefaults.AbandonedUploadHours);
            var files = Directory.GetFiles(_config.TusDir);

            var cleaned = 0;
            foreach (var file in files)
            {
                var fileInfo = new FileInfo(file);
                if (fileInfo.LastWriteTimeUtc < cutoff)
                {
                    try
                    {
                        fileInfo.Delete();
                        cleaned++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete orphaned tus file {File}", file);
                    }
                }
            }

            if (cleaned > 0)
                _logger.LogInformation("Cleaned {Count} orphaned tus temp files", cleaned);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning orphaned tus files");
        }
    }
}
