using Microsoft.EntityFrameworkCore;
using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.Account.DeleteAccount;

/// <summary>
/// Handler for DeleteAccount operation.
/// Contains business logic for deleting user account.
/// </summary>
public static class DeleteAccountHandler
{
    public static async Task ExecuteAsync(
        AppDbContext db,
        IFileStorageService fileStorage,
        HttpContext context)
    {
        var user = await db.GetCurrentUserAsync(context);

        if (user.AvatarFileId.HasValue)
            await fileStorage.DeleteAvatarAsync(user.AvatarFileId.Value);

        var tokens = await db.Tokens.Where(t => t.UserId == user.Id).ToListAsync();
        db.Tokens.RemoveRange(tokens);

        db.Users.Remove(user);
        await db.SaveChangesAsync();
    }
}
