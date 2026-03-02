using System.ComponentModel.DataAnnotations.Schema;
using Pawthorize.Abstractions;

namespace DeadDrop.Domain.Entities;

public class User : IAuthenticatedUser
{
    // Core identity fields (Required by Pawthorize)
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // Profile fields
    public string? FirstName { get; set; }
    public string? LastName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Avatar
    public Guid? AvatarFileId { get; set; }
    public string? AvatarUrl { get; set; }

    // Computed
    [NotMapped]
    public string? Name => string.IsNullOrWhiteSpace(FirstName) && string.IsNullOrWhiteSpace(LastName)
        ? null
        : $"{FirstName} {LastName}".Trim();

    // Authorization (Required by Pawthorize)
    public IList<string> Roles { get; set; } = new List<string>();
    IEnumerable<string> IAuthenticatedUser.Roles => Roles;

    public IDictionary<string, string>? AdditionalClaims => null;

    // Security (Required by Pawthorize)
    public bool IsEmailVerified { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LockedUntil { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }
}
