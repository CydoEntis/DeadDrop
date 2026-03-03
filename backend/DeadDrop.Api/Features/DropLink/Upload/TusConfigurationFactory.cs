using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StashPup.Core.Interfaces;
using tusdotnet;
using tusdotnet.Models;
using tusdotnet.Models.Configuration;
using tusdotnet.Stores;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Upload;

public static class TusConfigurationFactory
{
    public static Func<HttpContext, Task<DefaultTusConfiguration>> CreateConfiguration(IServiceProvider serviceProvider)
    {
        return async httpContext =>
        {
            var config = httpContext.RequestServices.GetRequiredService<IOptions<DropLinkConfig>>().Value;

            // Ensure tus directory exists
            Directory.CreateDirectory(config.TusDir);

            return new DefaultTusConfiguration
            {
                UrlPath = "/api/droplink/uploads",
                Store = new TusDiskStore(config.TusDir),
                MaxAllowedUploadSizeInBytesLong = config.MaxBytesPerDropDefault,
                Events = new Events
                {
                    OnAuthorizeAsync = async eventContext =>
                    {
                        await OnAuthorize(eventContext, config);
                    },
                    OnFileCompleteAsync = async eventContext =>
                    {
                        await OnFileComplete(eventContext, config);
                    }
                }
            };
        };
    }

    private static async Task OnAuthorize(AuthorizeContext context, DropLinkConfig config)
    {
        // Allow OPTIONS requests for CORS preflight
        if (context.HttpContext.Request.Method == "OPTIONS")
            return;

        // For file creation, validate the drop exists
        if (context.HttpContext.Request.Method == "POST")
        {
            var metadata = context.HttpContext.Request.Headers["Upload-Metadata"].ToString();
            var dropId = ParseMetadataValue(metadata, "dropId");

            if (string.IsNullOrEmpty(dropId))
            {
                context.FailRequest("Missing dropId in upload metadata");
                return;
            }

            using var scope = context.HttpContext.RequestServices.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DropLinkDbContext>();

            if (!Guid.TryParse(dropId, out var dropGuid))
            {
                context.FailRequest("Invalid dropId");
                return;
            }

            var drop = await db.Drops
                .Include(d => d.InviteCode)
                .FirstOrDefaultAsync(d => d.Id == dropGuid);

            if (drop is null)
            {
                context.FailRequest(DropLinkErrorMessages.DropNotFound);
                return;
            }

            if (drop.Status != DropStatus.Created && drop.Status != DropStatus.Uploading)
            {
                context.FailRequest("Drop is not in a valid state for upload");
                return;
            }

            if (drop.InviteCode.IsRevoked)
            {
                context.FailRequest(DropLinkErrorMessages.InviteCodeRevoked);
                return;
            }

            // Check upload size against invite limits
            var uploadLength = context.HttpContext.Request.Headers["Upload-Length"].ToString();
            if (long.TryParse(uploadLength, out var fileSize))
            {
                var maxPerDrop = drop.InviteCode.MaxBytesPerDrop ?? config.MaxBytesPerDropDefault;
                if (fileSize > maxPerDrop)
                {
                    context.FailRequest(DropLinkErrorMessages.UploadTooLarge);
                    return;
                }

                if (drop.InviteCode.MaxTotalBytes.HasValue)
                {
                    var remaining = drop.InviteCode.MaxTotalBytes.Value - drop.InviteCode.UsedTotalBytes;
                    if (fileSize > remaining)
                    {
                        context.FailRequest(DropLinkErrorMessages.InviteCodeStorageLimitReached);
                        return;
                    }
                }
            }
        }
    }

    private static async Task OnFileComplete(FileCompleteContext context, DropLinkConfig config)
    {
        using var scope = context.HttpContext.RequestServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DropLinkDbContext>();
        var fileStorage = scope.ServiceProvider.GetRequiredService<IFileStorage>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<DropLinkDbContext>>();

        var file = await context.GetFileAsync();
        var metadata = await file.GetMetadataAsync(context.CancellationToken);

        var dropIdStr = metadata.TryGetValue("dropId", out var dropIdMeta)
            ? dropIdMeta.GetString(System.Text.Encoding.UTF8)
            : null;

        if (string.IsNullOrEmpty(dropIdStr) || !Guid.TryParse(dropIdStr, out var dropId))
        {
            logger.LogError("tus upload complete but missing dropId metadata");
            return;
        }

        var drop = await db.Drops
            .Include(d => d.InviteCode)
            .FirstOrDefaultAsync(d => d.Id == dropId);

        if (drop is null)
        {
            logger.LogError("tus upload complete but drop {DropId} not found", dropId);
            return;
        }

        // Upload file from tus store to S3 via StashPup
        await using var tusStream = await file.GetContentAsync(context.CancellationToken);
        var saveResult = await fileStorage.SaveAsync(
            tusStream,
            drop.OriginalFilename,
            folder: "drops",
            ct: context.CancellationToken);

        if (!saveResult.Success)
        {
            logger.LogError("Failed to save drop {DropId} to S3: {Error}", dropId, saveResult.ErrorMessage);
            drop.Status = DropStatus.Failed;
            await db.SaveChangesAsync();
            return;
        }

        var fileRecord = saveResult.Data;

        // Update drop — start TTL now that upload is complete
        drop.StorageFileId = fileRecord.Id;
        drop.StoragePath = fileRecord.StoragePath;
        drop.SizeBytes = fileRecord.SizeBytes;
        drop.Status = DropStatus.Ready;
        drop.TusFileId = file.Id;
        drop.ExpiresAt = DateTime.UtcNow.AddSeconds(drop.TtlSeconds);

        // Update invite usage
        drop.InviteCode.UsedTotalBytes += fileRecord.SizeBytes;

        await db.SaveChangesAsync();

        // Clean up tus temp file
        try
        {
            var store = (TusDiskStore)context.Store;
            await store.DeleteFileAsync(file.Id, context.CancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to clean up tus temp file {FileId}", file.Id);
        }

        logger.LogInformation("Drop {PublicId} upload complete: {Size} bytes → S3", drop.PublicId, fileRecord.SizeBytes);
    }

    private static string? ParseMetadataValue(string metadata, string key)
    {
        if (string.IsNullOrEmpty(metadata)) return null;

        var pairs = metadata.Split(',', StringSplitOptions.RemoveEmptyEntries);
        foreach (var pair in pairs)
        {
            var parts = pair.Trim().Split(' ', 2);
            if (parts.Length == 2 && parts[0] == key)
            {
                try
                {
                    return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(parts[1]));
                }
                catch
                {
                    return parts[1];
                }
            }
        }

        return null;
    }
}
