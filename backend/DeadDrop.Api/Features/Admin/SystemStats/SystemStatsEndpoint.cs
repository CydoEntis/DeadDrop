using DeadDrop.Infrastructure.Data;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Admin.SystemStats;

/// <summary>
/// Endpoint mapping for SystemStats: GET /api/admin/stats
/// </summary>
public static class SystemStatsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/stats", async (AppDbContext db, HttpContext context) =>
        {
            var stats = await SystemStatsHandler.ExecuteAsync(db);
            return stats.Ok(context);
        });
    }
}
