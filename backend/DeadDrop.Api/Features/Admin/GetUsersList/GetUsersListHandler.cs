using Microsoft.EntityFrameworkCore;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Admin.GetUsersList;

/// <summary>
/// Handler for GetUsersList operation.
/// Contains business logic for retrieving and filtering users.
/// </summary>
public static class GetUsersListHandler
{
    public static async Task<object> ExecuteAsync(
        AppDbContext db,
        HttpContext context,
        string? search = null,
        string? role = null,
        bool? isLocked = null,
        bool? isVerified = null,
        string sortBy = "email",
        string sortOrder = "asc",
        int page = 1,
        int pageSize = 10)
    {
        var totalUsers = await db.Users.CountAsync();
        var activeUsers = await db.Users.CountAsync(u => !u.IsLocked);
        var lockedUsers = totalUsers - activeUsers;

        var query = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(searchLower) ||
                (u.FirstName != null && u.FirstName.ToLower().Contains(searchLower)) ||
                (u.LastName != null && u.LastName.ToLower().Contains(searchLower)));
        }

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Roles.Contains(role));

        if (isLocked.HasValue)
            query = query.Where(u => u.IsLocked == isLocked.Value);

        if (isVerified.HasValue)
            query = query.Where(u => u.IsEmailVerified == isVerified.Value);

        query = (sortBy.ToLower(), sortOrder.ToLower()) switch
        {
            ("email", "desc") => query.OrderByDescending(u => u.Email),
            ("email", _) => query.OrderBy(u => u.Email),
            ("firstname", "desc") => query.OrderByDescending(u => u.FirstName),
            ("firstname", _) => query.OrderBy(u => u.FirstName),
            ("lastname", "desc") => query.OrderByDescending(u => u.LastName),
            ("lastname", _) => query.OrderBy(u => u.LastName),
            ("islocked", "desc") => query.OrderByDescending(u => u.IsLocked),
            ("islocked", _) => query.OrderBy(u => u.IsLocked),
            ("isemailverified", "desc") => query.OrderByDescending(u => u.IsEmailVerified),
            ("isemailverified", _) => query.OrderBy(u => u.IsEmailVerified),
            _ => query.OrderBy(u => u.Email)
        };

        var filteredCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)filteredCount / pageSize);

        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserResponse(
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Roles,
                u.IsEmailVerified,
                u.IsLocked))
            .ToListAsync();

        return new
        {
            data = users,
            meta = new
            {
                pagination = new
                {
                    page,
                    pageSize,
                    totalCount = filteredCount,
                    totalPages,
                    hasNextPage = page < totalPages,
                    hasPreviousPage = page > 1
                },
                stats = new
                {
                    totalUsers,
                    activeUsers,
                    lockedUsers
                }
            }
        };
    }
}
