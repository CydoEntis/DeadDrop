using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Admin.DeleteUser;

/// <summary>
/// Handler for DeleteUser operation.
/// Contains business logic for deleting a user account.
/// </summary>
public static class DeleteUserHandler
{
    public static async Task ExecuteAsync(AppDbContext db, string userId, string currentUserId)
    {
        if (userId == currentUserId)
            throw new BadRequestError("You cannot delete your own account from admin panel");

        var user = await db.GetUserByIdAsync(userId);

        var tokens = await db.Tokens.Where(t => t.UserId == userId).ToListAsync();
        db.Tokens.RemoveRange(tokens);

        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }
}
