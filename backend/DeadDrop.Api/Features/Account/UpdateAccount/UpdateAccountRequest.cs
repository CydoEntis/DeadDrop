namespace DeadDrop.Features.Account.UpdateAccount;

/// <summary>
/// Request DTO for updating account information.
/// </summary>
public record UpdateAccountRequest(
    string? FirstName,
    string? LastName
);
