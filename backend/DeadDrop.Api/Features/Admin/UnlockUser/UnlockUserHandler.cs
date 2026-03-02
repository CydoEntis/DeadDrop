using DeadDrop.Domain.Entities;
using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Admin.UnlockUser;

/// <summary>
/// Handler for UnlockUser operation.
/// Contains business logic for unlocking user account.
/// </summary>
public static class UnlockUserHandler
{
    public static async Task ExecuteAsync(AppDbContext db, string userId)
    {
        var user = await db.GetUserByIdAsync(userId);

        user.IsLocked = false;
        user.LockedUntil = null;
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        await db.SaveChangesAsync();
    }
}
