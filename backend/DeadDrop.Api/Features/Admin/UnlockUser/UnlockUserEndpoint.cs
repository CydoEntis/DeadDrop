using DeadDrop.Infrastructure.Data;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Admin.UnlockUser;

/// <summary>
/// Endpoint mapping for UnlockUser: POST /api/admin/users/{userId}/unlock
/// </summary>
public static class UnlockUserEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/users/{userId}/unlock", async (string userId, AppDbContext db, HttpContext context) =>
        {
            await UnlockUserHandler.ExecuteAsync(db, userId);
            return new { message = "User unlocked successfully" }.Ok(context);
        });
    }
}
