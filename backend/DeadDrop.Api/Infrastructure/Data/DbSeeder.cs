using Microsoft.EntityFrameworkCore;
using DeadDrop.Domain.Entities;
using DeadDrop.Features.Shared.Constants;

namespace DeadDrop.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();
        await context.Database.MigrateAsync();

        var adminEmail = config["Admin:Email"] ?? "admin@deaddrop.dev";
        var adminPassword = config["Admin:Password"] ?? "Admin123!";

        if (!await context.Users.AnyAsync(u => u.Email == adminEmail))
        {
            var admin = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                FirstName = "Admin",
                Roles = new List<string> { UserRoles.Admin, UserRoles.User },
                IsEmailVerified = true,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded admin account: {Email}", adminEmail);
        }
        else
        {
            logger.LogInformation("Admin account already exists, skipping seed");
        }
    }
}
