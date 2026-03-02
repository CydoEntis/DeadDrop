using ErrorHound.BuiltIn;
using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.Account.DeleteAvatar;

/// <summary>
/// Handler for DeleteAvatar operation.
/// Contains business logic for deleting user avatar.
/// </summary>
public static class DeleteAvatarHandler
{
    public static async Task ExecuteAsync(
        AppDbContext db,
        IFileStorageService fileStorage,
        HttpContext context)
    {
        var user = await db.GetCurrentUserAsync(context);

        if (user.AvatarFileId is null)
            throw new NotFoundError("No avatar to delete");

        await fileStorage.DeleteAvatarAsync(user.AvatarFileId.Value);

        user.AvatarFileId = null;
        user.AvatarUrl = null;
        await db.SaveChangesAsync();
    }
}
