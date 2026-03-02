using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.Account.DeleteAvatar;

/// <summary>
/// Endpoint mapping for DeleteAvatar: DELETE /api/account/avatar
/// </summary>
public static class DeleteAvatarEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapDelete("/avatar",
            async (AppDbContext db, IFileStorageService fileStorage, HttpContext context) =>
            {
                await DeleteAvatarHandler.ExecuteAsync(db, fileStorage, context);
                return Results.NoContent();
            });
    }
}
