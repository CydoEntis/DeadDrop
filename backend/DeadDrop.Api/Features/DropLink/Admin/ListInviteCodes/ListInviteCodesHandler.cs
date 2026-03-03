using Microsoft.EntityFrameworkCore;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Admin.ListInviteCodes;

public class ListInviteCodesHandler
{
    private readonly DropLinkDbContext _db;

    public ListInviteCodesHandler(DropLinkDbContext db)
    {
        _db = db;
    }

    public async Task<object> ExecuteAsync(int page, int pageSize, string? searchTerm, string? statusFilter, string? sortBy)
    {
        var query = _db.InviteCodes.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(i => i.Label.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(statusFilter))
        {
            var now = DateTime.UtcNow;
            query = statusFilter.ToLower() switch
            {
                "active" => query.Where(i =>
                    !i.IsRevoked &&
                    (i.ExpiresAt == null || i.ExpiresAt > now) &&
                    (i.MaxDropCount == null || i.UsedDropCount < i.MaxDropCount) &&
                    (i.MaxTotalBytes == null || i.UsedTotalBytes < i.MaxTotalBytes)),
                "revoked" => query.Where(i => i.IsRevoked),
                "expired" => query.Where(i =>
                    !i.IsRevoked &&
                    i.ExpiresAt != null && i.ExpiresAt <= now),
                "used" => query.Where(i =>
                    !i.IsRevoked &&
                    ((i.MaxDropCount != null && i.UsedDropCount >= i.MaxDropCount) ||
                     (i.MaxTotalBytes != null && i.UsedTotalBytes >= i.MaxTotalBytes))),
                _ => query
            };
        }

        query = sortBy?.ToLower() switch
        {
            "expires_asc" => query.OrderBy(i => i.ExpiresAt),
            "expires_desc" => query.OrderByDescending(i => i.ExpiresAt),
            _ => query.OrderByDescending(i => i.CreatedAt)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new InviteCodeResponse(
                i.Id,
                i.Code,
                i.Label,
                i.CreatedAt,
                i.ExpiresAt,
                i.IsRevoked,
                i.MaxTotalBytes,
                i.MaxDropCount,
                i.MaxBytesPerDrop,
                i.DefaultTtlSeconds,
                i.MaxTtlSeconds,
                i.UsedTotalBytes,
                i.UsedDropCount,
                i.LastUsedAt))
            .ToListAsync();

        return new
        {
            Data = items,
            Meta = new
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }
        };
    }
}
