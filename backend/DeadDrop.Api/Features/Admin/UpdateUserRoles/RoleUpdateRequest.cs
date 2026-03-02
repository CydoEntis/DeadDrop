namespace DeadDrop.Features.Admin.UpdateUserRoles;

/// <summary>
/// Request DTO for updating user roles.
/// </summary>
public record RoleUpdateRequest(IList<string> Roles);
