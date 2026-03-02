using DeadDrop.Domain.Entities;
using DeadDrop.Features.Account.Models;

namespace DeadDrop.Features.Account.Mappers;

public static class AccountMapper
{
    public static AccountResponse ToAccountResponse(this User user, bool requiresEmailVerification)
    {
        return new AccountResponse(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.AvatarUrl,
            user.Roles,
            user.IsEmailVerified,
            !string.IsNullOrEmpty(user.PasswordHash),
            requiresEmailVerification
        );
    }
}
