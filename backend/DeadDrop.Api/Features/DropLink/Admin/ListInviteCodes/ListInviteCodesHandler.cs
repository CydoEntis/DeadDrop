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

    public async Task<object> ExecuteAsync(int page, int pageSize)
    {
        var query = _db.InviteCodes
            .OrderByDescending(i => i.CreatedAt);

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
