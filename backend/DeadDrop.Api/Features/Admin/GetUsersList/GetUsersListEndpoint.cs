using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Admin.GetUsersList;

/// <summary>
/// Endpoint mapping for GetUsersList: GET /api/admin/users
/// </summary>
public static class GetUsersListEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/users", async (
            AppDbContext db,
            HttpContext context,
            string? search = null,
            string? role = null,
            bool? isLocked = null,
            bool? isVerified = null,
            string sortBy = "email",
            string sortOrder = "asc",
            int page = 1,
            int pageSize = 10) =>
        {
            return await GetUsersListHandler.ExecuteAsync(db, context, search, role, isLocked, isVerified, sortBy, sortOrder, page, pageSize);
        });
    }
}
