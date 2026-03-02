namespace DeadDrop.Features.Account.Models;

public record AccountResponse(
    string Id,
    string Email,
    string? FirstName,
    string? LastName,
    string? AvatarUrl,
    IList<string> Roles,
    bool IsEmailVerified,
    bool HasPassword,
    bool RequiresEmailVerification
);
