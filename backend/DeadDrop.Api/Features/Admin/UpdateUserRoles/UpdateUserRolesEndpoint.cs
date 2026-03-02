using DeadDrop.Infrastructure.Data;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Admin.UpdateUserRoles;

/// <summary>
/// Endpoint mapping for UpdateUserRoles: POST /api/admin/users/{userId}/roles
/// </summary>
public static class UpdateUserRolesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/users/{userId}/roles",
            async (string userId, RoleUpdateRequest request, AppDbContext db, HttpContext context) =>
            {
                await UpdateUserRolesHandler.ExecuteAsync(db, userId, request);
                return new { message = "Roles updated successfully" }.Ok(context);
            });
    }
}
