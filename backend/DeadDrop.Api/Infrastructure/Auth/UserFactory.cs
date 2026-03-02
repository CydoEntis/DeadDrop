using Pawthorize.Abstractions;
using Pawthorize.Endpoints.Register;
using DeadDrop.Domain.Entities;
using DeadDrop.Features.Shared.Constants;

namespace DeadDrop.Infrastructure.Auth;

public class UserFactory : IUserFactory<User, RegisterRequest>
{
    public User CreateUser(RegisterRequest request, string passwordHash)
    {
        return new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = request.Email,
            PasswordHash = passwordHash,
            FirstName = request.FirstName,
            LastName = request.LastName,
            IsEmailVerified = false,
            IsLocked = false,
            Roles = new List<string> { UserRoles.User }
        };
    }
}
