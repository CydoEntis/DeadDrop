using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Admin.DeleteUser;

/// <summary>
/// Endpoint mapping for DeleteUser: DELETE /api/admin/users/{userId}
/// </summary>
public static class DeleteUserEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapDelete("/users/{userId}", async (string userId, AppDbContext db, HttpContext context) =>
        {
            var currentUserId = context.GetCurrentUserId();
            await DeleteUserHandler.ExecuteAsync(db, userId, currentUserId);
            return new { message = "User deleted successfully" }.Ok(context);
        });
    }
}
