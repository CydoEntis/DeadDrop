using DeadDrop.Infrastructure.Data;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Admin.LockUser;

/// <summary>
/// Endpoint mapping for LockUser: POST /api/admin/users/{userId}/lock
/// </summary>
public static class LockUserEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/users/{userId}/lock", async (string userId, AppDbContext db, HttpContext context) =>
        {
            await LockUserHandler.ExecuteAsync(db, userId);
            return new { message = "User locked successfully" }.Ok(context);
        });
    }
}
