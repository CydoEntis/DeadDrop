using Pawthorize.Abstractions;
using Pawthorize.Endpoints.Register;
using Pawthorize.Services;
using DeadDrop.Domain.Entities;
using DeadDrop.Infrastructure.Auth;

namespace DeadDrop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IUserFactory<User, RegisterRequest>, UserFactory>();

        return services;
    }
}
