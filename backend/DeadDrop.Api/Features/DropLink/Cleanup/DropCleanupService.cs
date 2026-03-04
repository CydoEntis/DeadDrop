using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

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
        var s3 = scope.ServiceProvider.GetRequiredService<S3DirectService>();
        var now = DateTime.UtcNow;

        var expiredDrops = await db.Drops
            .Where(d => d.ExpiresAt.HasValue && d.ExpiresAt < now && d.Status != DropStatus.Deleted && d.Status != DropStatus.Expired && d.Status != DropStatus.Failed)
            .ToListAsync(cancellationToken);

        foreach (var drop in expiredDrops)
        {
            try
            {
                if (!string.IsNullOrEmpty(drop.StoragePath))
                    await s3.DeleteObjectAsync(drop.StoragePath, cancellationToken);

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

        var abandonedCutoff = now.AddHours(-DropLinkDefaults.AbandonedUploadHours);
        var abandonedDrops = await db.Drops
            .Where(d => d.CreatedAt < abandonedCutoff && (d.Status == DropStatus.Created || d.Status == DropStatus.Uploading))
            .ToListAsync(cancellationToken);

        foreach (var drop in abandonedDrops)
        {
            if (!string.IsNullOrEmpty(drop.StoragePath) && !string.IsNullOrEmpty(drop.S3UploadId))
            {
                try
                {
                    await s3.AbortMultipartUploadAsync(drop.StoragePath, drop.S3UploadId, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to abort multipart upload for abandoned drop {DropId}", drop.Id);
                }
            }

            drop.Status = DropStatus.Failed;
        }

        if (abandonedDrops.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Marked {Count} abandoned uploads as failed", abandonedDrops.Count);
        }

        var deletingDrops = await db.Drops
            .Where(d => d.Status == DropStatus.Deleting)
            .ToListAsync(cancellationToken);

        foreach (var drop in deletingDrops)
        {
            try
            {
                if (!string.IsNullOrEmpty(drop.StoragePath))
                    await s3.DeleteObjectAsync(drop.StoragePath, cancellationToken);

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

        var eventCutoff = now.AddDays(-DropLinkDefaults.DownloadEventRetentionDays);
        var purgedEvents = await db.DownloadEvents
            .Where(e => e.StartedAt < eventCutoff)
            .ExecuteDeleteAsync(cancellationToken);

        if (purgedEvents > 0)
            _logger.LogInformation("Purged {Count} old download events", purgedEvents);
    }
}
