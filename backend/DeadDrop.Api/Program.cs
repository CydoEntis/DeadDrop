/*
 * DeadDrop API - Application Entry Point
 *
 * CUSTOMIZATION GUIDE:
 *
 * 1. LOGGING (lines 17-28):
 *    - Change log file path from "logs/deaddrop-.log" to your app name
 *    - Adjust retainedFileCountLimit (default: 7 days)
 *    - Modify output templates for different log formats
 *
 * 2. CORS (lines 35-46):
 *    - Update "Cors:AllowedOrigins" in appsettings.json for production URLs
 *    - Add/remove headers in WithExposedHeaders() if needed
 *
 * 3. AUTHENTICATION (lines 48-54):
 *    - Add OAuth providers: .AddGitHub(), .AddMicrosoft(), .AddFacebook()
 *    - Remove .AddGoogle() or .AddDiscord() if not needed
 *    - Configure providers in appsettings.json
 *
 * 4. CUSTOM ENDPOINTS (lines 94-96):
 *    - Add your own endpoint groups: app.MapYourEndpoints()
 *    - Place endpoint files in Endpoints/ folder
 *
 * 5. HEALTH CHECKS (line 65):
 *    - Add custom health checks: .AddCheck<YourHealthCheck>("your-check")
 *    - Monitor at /health endpoint
 */

using Pawthorize.Extensions;
using DeadDrop.Domain.Entities;
using DeadDrop.Features.Admin;
using DeadDrop.Features.Account;
using DeadDrop.Infrastructure;
using DeadDrop.Infrastructure.Data;
using Serilog;
using SuccessHound.Extensions;
using SuccessHound.Defaults;
using SuccessHound.Pagination;
using SuccessHound.AspNetExtensions;
using StashPup.AspNetCore.Extensions;
using DeadDrop.Features.DropLink;
using DeadDrop.Features.DropLink.Cleanup;
using DeadDrop.Infrastructure.FileStorage;
using Microsoft.AspNetCore.RateLimiting;


var builder = WebApplication.CreateBuilder(args);

// LOGGING: Configure Serilog for structured logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentName()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}{NewLine}{Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/deaddrop-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext} {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// API DOCUMENTATION: Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: Configure allowed frontend origins
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
              .WithExposedHeaders("X-XSRF-TOKEN");
    });
});

// DATABASE & APPLICATION SERVICES
builder.Services.AddData(builder.Configuration);
builder.Services.AddApplication(builder.Configuration);

// DROPLINK: Accountless file sharing services
builder.Services.AddDropLink(builder.Configuration);
builder.Services.AddHostedService<DropCleanupService>();

// RATE LIMITING: Protect DropLink endpoints
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddFixedWindowLimiter("droplink-upload", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
    });
    options.AddFixedWindowLimiter("droplink-download-auth", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(1);
    });
});

// AUTHENTICATION: Pawthorize configuration
builder.Services.AddPawthorize<User>(options =>
{
    options.UseConfiguration(builder.Configuration);
    options.UseDefaultFormatters();
});

var s3Config = builder.Configuration.GetSection("StashPup:S3");
builder.Services.AddStashPup(stash => stash
    .UseS3(options =>
    {
        options.BucketName = s3Config["BucketName"] ?? "deaddrop";
        options.Region = s3Config["Region"] ?? "garage";
        options.ServiceUrl = s3Config["ServiceUrl"] ?? "";
        options.ForcePathStyle = s3Config.GetValue<bool>("ForcePathStyle", true);
        options.AccessKeyId = s3Config["AccessKeyId"] ?? "";
        options.SecretAccessKey = s3Config["SecretAccessKey"] ?? "";
        options.EnableEncryption = s3Config.GetValue<bool>("EnableEncryption", false);
        options.MaxFileSizeBytes = null;
    }));

// API RESPONSE FORMATTING: SuccessHound for consistent responses
builder.Services.AddSuccessHound(options =>
{
    options.UseFormatter<DefaultSuccessFormatter>();
    options.UsePagination();
});

// HEALTH CHECKS: Monitor application health at /health
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database")
    .AddDbContextCheck<DropLinkDbContext>("droplink-database");

var app = builder.Build();

// Seed admin account on first run (safe — skips if admin already exists)
await DbSeeder.SeedAsync(app.Services);

// Configure S3 bucket CORS so browsers can PUT directly to Garage
var s3Service = app.Services.GetRequiredService<S3DirectService>();
try
{
    await s3Service.ConfigureBucketCorsAsync(allowedOrigins);
    Log.Information("S3 bucket CORS configured for {Origins}", string.Join(", ", allowedOrigins));
}
catch (Exception ex)
{
    Log.Warning(ex, "Failed to configure S3 bucket CORS — direct uploads may fail");
}

// DEVELOPMENT ONLY: Enable Swagger UI at /swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// MIDDLEWARE PIPELINE ORDER MATTERS!

app.UseSerilogRequestLogging();

app.UseHttpsRedirection();

app.UseStaticFiles();

if (builder.Configuration.GetValue<string>("StashPup:Provider") == "Local")
    app.UseStashPup();

app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseSuccessHound();

app.UsePawthorize();

// ENDPOINT MAPPING
app.MapPawthorize();          // Auth endpoints (/api/auth/*)
AdminEndpoints.Map(app);      // Admin endpoints (/api/admin/*)
AccountEndpoints.Map(app);    // Account endpoints (/api/account/*)
DropLinkEndpoints.Map(app);   // DropLink endpoints (/api/droplink/*)
app.MapHealthChecks("/health");

try
{
    Log.Information("Starting DeadDrop API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
