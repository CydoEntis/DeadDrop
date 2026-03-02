using Microsoft.EntityFrameworkCore;
using Pawthorize.Abstractions;
using Pawthorize.Services;
using DeadDrop.Domain.Entities;
using DeadDrop.Infrastructure.Auth;
using DeadDrop.Infrastructure.FileStorage;
using DeadDrop.Features.DropLink.Download;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Features.DropLink.VerifyInvite;
using DeadDrop.Features.DropLink.CreateDrop;
using DeadDrop.Features.DropLink.GetDropMetadata;
using DeadDrop.Features.DropLink.Admin.CreateInviteCode;
using DeadDrop.Features.DropLink.Admin.ListInviteCodes;
using DeadDrop.Features.DropLink.Admin.RevokeInviteCode;
using DeadDrop.Features.DropLink.Admin.DeleteInviteCode;
using DeadDrop.Features.DropLink.Admin.GetStats;
using DeadDrop.Features.DropLink.Admin.ListDrops;
using DeadDrop.Features.DropLink.Admin.DeleteDrop;

namespace DeadDrop.Infrastructure.Data;

public static class DependencyInjection
{
    public static IServiceCollection AddData(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(config.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserRepository<User>, UserRepository>();
        services.AddScoped<ITokenRepository, TokenRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IExternalAuthRepository<User>, ExternalAuthRepository>();
        services.AddScoped<IEmailChangeTokenRepository, EmailChangeTokenRepository>();

        services.AddSingleton<IFileStorageService, LocalFileStorageService>();

        return services;
    }

    public static IServiceCollection AddDropLink(this IServiceCollection services, IConfiguration config)
    {
        // Database
        services.AddDbContext<DropLinkDbContext>(options =>
            options.UseNpgsql(config.GetConnectionString("DefaultConnection")));

        // Configuration
        services.Configure<DropLinkConfig>(config.GetSection("DropLink"));

        // Singleton services
        services.AddSingleton<DownloadTokenStore>();

        // Scoped handlers
        services.AddScoped<VerifyInviteHandler>();
        services.AddScoped<CreateDropHandler>();
        services.AddScoped<GetDropMetadataHandler>();
        services.AddScoped<AuthorizeDownloadHandler>();
        services.AddScoped<DownloadDropHandler>();
        services.AddScoped<CreateInviteCodeHandler>();
        services.AddScoped<ListInviteCodesHandler>();
        services.AddScoped<RevokeInviteCodeHandler>();
        services.AddScoped<DeleteInviteCodeHandler>();
        services.AddScoped<GetStatsHandler>();
        services.AddScoped<ListDropsHandler>();
        services.AddScoped<DeleteDropHandler>();

        return services;
    }
}