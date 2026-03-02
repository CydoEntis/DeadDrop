using DeadDrop.Domain.Entities;
using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Admin.LockUser;

/// <summary>
/// Handler for LockUser operation.
/// Contains business logic for locking user account.
/// </summary>
public static class LockUserHandler
{
    public static async Task ExecuteAsync(AppDbContext db, string userId)
    {
        var user = await db.GetUserByIdAsync(userId);

        user.IsLocked = true;
        user.LockedUntil = DateTime.UtcNow.AddYears(100);
        await db.SaveChangesAsync();
    }
}
