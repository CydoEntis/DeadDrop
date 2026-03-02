using DeadDrop.Features.Shared.Constants;

namespace DeadDrop.Features.Admin;

public static class AdminEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/admin")
            .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin))
            .WithTags("Admin");

        GetUsersList.GetUsersListEndpoint.Map(group);
        UpdateUserRoles.UpdateUserRolesEndpoint.Map(group);
        LockUser.LockUserEndpoint.Map(group);
        UnlockUser.UnlockUserEndpoint.Map(group);
        DeleteUser.DeleteUserEndpoint.Map(group);
        SystemStats.SystemStatsEndpoint.Map(group);
    }
}
