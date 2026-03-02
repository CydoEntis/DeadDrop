namespace DeadDrop.Features.Admin.GetUsersList;

/// <summary>
/// Response DTO for admin user list.
/// </summary>
public record AdminUserResponse(
    string Id,
    string Email,
    string? FirstName,
    string? LastName,
    IList<string> Roles,
    bool IsEmailVerified,
    bool IsLocked
);
