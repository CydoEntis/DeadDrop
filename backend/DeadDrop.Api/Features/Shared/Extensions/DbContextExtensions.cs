using ErrorHound.BuiltIn;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Domain.Entities;

namespace DeadDrop.Features.Shared.Extensions;

public static class DbContextExtensions
{
    /// <summary>
    /// Gets the currently authenticated user from the DB, or throws if not found.
    /// </summary>
    public static async Task<User> GetCurrentUserAsync(this AppDbContext db, HttpContext context)
    {
        var userId = context.GetCurrentUserId();
        var user = await db.Users.FindAsync(userId);
        return user ?? throw new NotFoundError("User not found");
    }

    /// <summary>
    /// Gets a user by ID, throws NotFoundError if it doesn't exist.
    /// </summary>
    public static async Task<User> GetUserByIdAsync(this AppDbContext db, string userId)
    {
        var user = await db.Users.FindAsync(userId);
        if (user is null)
            throw new NotFoundError("User not found");

        return user;
    }
}