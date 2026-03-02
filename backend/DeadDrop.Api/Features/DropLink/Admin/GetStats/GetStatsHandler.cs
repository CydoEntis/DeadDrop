using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Admin.GetStats;

public class GetStatsHandler
{
    private readonly DropLinkDbContext _db;

    public GetStatsHandler(DropLinkDbContext db)
    {
        _db = db;
    }

    public async Task<DropLinkStatsResponse> ExecuteAsync()
    {
        var now = DateTime.UtcNow;

        var totalStorageUsed = await _db.Drops
            .Where(d => d.Status == DropStatus.Ready)
            .SumAsync(d => d.SizeBytes ?? 0);

        var activeDrops = await _db.Drops
            .CountAsync(d => d.Status == DropStatus.Ready && d.ExpiresAt > now);

        var downloads24h = await _db.DownloadEvents
            .CountAsync(e => e.WasSuccess && e.StartedAt > now.AddHours(-24));

        var downloads7d = await _db.DownloadEvents
            .CountAsync(e => e.WasSuccess && e.StartedAt > now.AddDays(-7));

        var downloads30d = await _db.DownloadEvents
            .CountAsync(e => e.WasSuccess && e.StartedAt > now.AddDays(-30));

        var totalBytesTransferred = await _db.DownloadEvents
            .Where(e => e.WasSuccess)
            .SumAsync(e => e.BytesSent);

        var activeInviteCodes = await _db.InviteCodes
            .CountAsync(i => !i.IsRevoked && (i.ExpiresAt == null || i.ExpiresAt > now));

        var totalInviteCodes = await _db.InviteCodes.CountAsync();

        return new DropLinkStatsResponse(
            TotalStorageUsedBytes: totalStorageUsed,
            ActiveDropsCount: activeDrops,
            TotalDownloads24h: downloads24h,
            TotalDownloads7d: downloads7d,
            TotalDownloads30d: downloads30d,
            TotalBytesTransferred: totalBytesTransferred,
            ActiveInviteCodesCount: activeInviteCodes,
            TotalInviteCodesCount: totalInviteCodes);
    }
}
