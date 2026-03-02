using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Admin.ListDrops;

public class ListDropsHandler
{
    private readonly DropLinkDbContext _db;

    public ListDropsHandler(DropLinkDbContext db)
    {
        _db = db;
    }

    public async Task<object> ExecuteAsync(int page, int pageSize, string? statusFilter)
    {
        var query = _db.Drops
            .Include(d => d.InviteCode)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(statusFilter) && Enum.TryParse<DropStatus>(statusFilter, true, out var status))
        {
            query = query.Where(d => d.Status == status);
        }

        query = query.OrderByDescending(d => d.CreatedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new AdminDropResponse(
                d.Id,
                d.PublicId,
                d.Status.ToString(),
                d.OriginalFilename,
                d.SizeBytes,
                d.CreatedAt,
                d.ExpiresAt,
                d.DownloadCount,
                d.DeleteAfterDownloads,
                d.InviteCode.Label))
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
