using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Admin.UpdateUserRoles;

/// <summary>
/// Handler for UpdateUserRoles operation.
/// Contains business logic for updating user roles.
/// </summary>
public static class UpdateUserRolesHandler
{
    public static async Task ExecuteAsync(AppDbContext db, string userId, RoleUpdateRequest request)
    {
        var user = await db.GetUserByIdAsync(userId);

        user.Roles = request.Roles;
        await db.SaveChangesAsync();
    }
}
