using Pawthorize.Abstractions;
using Pawthorize.Endpoints.Register;
using Pawthorize.Services;
using DeadDrop.Domain.Entities;
using DeadDrop.Infrastructure.Auth;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IUserFactory<User, RegisterRequest>, UserFactory>();
        services.AddScoped<IEmailSender, NoOpEmailSender>();
        services.AddScoped<IEmailTemplateProvider, NoOpEmailTemplateProvider>();

        services.AddSingleton<S3DirectService>();

        return services;
    }
}

public class NoOpEmailSender : IEmailSender
{
    public Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

public class NoOpEmailTemplateProvider : IEmailTemplateProvider
{
    public string GetEmailVerificationTemplate(string userName, string verificationUrl) => string.Empty;
    public string GetPasswordResetTemplate(string userName, string resetUrl) => string.Empty;
    public string GetEmailChangeVerificationTemplate(string userName, string newEmail, string verificationUrl) => string.Empty;
    public string GetEmailChangeNotificationTemplate(string userName, string oldEmail, string newEmail) => string.Empty;
}
