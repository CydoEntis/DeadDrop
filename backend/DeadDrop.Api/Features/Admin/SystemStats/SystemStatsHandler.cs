using Microsoft.EntityFrameworkCore;
using DeadDrop.Features.Shared.Constants;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Admin.SystemStats;

public static class SystemStatsHandler
{
    public static async Task<object> ExecuteAsync(AppDbContext db)
    {
        var totalUsers = await db.Users.CountAsync();
        var adminUsers = await db.Users.CountAsync(u => u.Roles.Contains(UserRoles.Admin));
        var lockedUsers = await db.Users.CountAsync(u => u.IsLocked);
        var activeUsers = totalUsers - lockedUsers;

        var lastUserRegistered = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => (DateTime?)u.CreatedAt)
            .FirstOrDefaultAsync();

        return new
        {
            totalUsers,
            adminUsers,
            lockedUsers,
            activeUsers,
            lastUserRegistered
        };
    }
}
