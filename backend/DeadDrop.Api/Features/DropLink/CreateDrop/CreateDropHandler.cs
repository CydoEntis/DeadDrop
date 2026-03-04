using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.CreateDrop;

public class CreateDropHandler
{
    private readonly DropLinkDbContext _db;
    private readonly DropLinkConfig _config;

    public CreateDropHandler(DropLinkDbContext db, IOptions<DropLinkConfig> config)
    {
        _db = db;
        _config = config.Value;
    }

    public async Task<CreateDropResponse> ExecuteAsync(CreateDropRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.InviteCode))
            throw new BadRequestError(DropLinkErrorMessages.InvalidInviteCode);

        if (string.IsNullOrWhiteSpace(request.OriginalFilename))
            throw new BadRequestError("Filename is required");

        // Validate invite code
        var codeHash = InviteCodeHasher.Hash(request.InviteCode.Trim());
        var invite = await _db.InviteCodes
            .FirstOrDefaultAsync(i => i.CodeHash == codeHash);

        if (invite is null)
            throw new BadRequestError(DropLinkErrorMessages.InvalidInviteCode);

        if (invite.IsRevoked)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeRevoked);

        if (invite.ExpiresAt.HasValue && invite.ExpiresAt.Value < DateTime.UtcNow)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeExpired);

        if (invite.MaxDropCount.HasValue && invite.UsedDropCount >= invite.MaxDropCount.Value)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeDropLimitReached);

        if (invite.MaxTotalBytes.HasValue && invite.UsedTotalBytes >= invite.MaxTotalBytes.Value)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeStorageLimitReached);

        // Validate TTL
        var maxTtl = invite.MaxTtlSeconds ?? _config.MaxTtlSecondsGlobal;
        if (request.TtlSeconds > maxTtl)
            throw new BadRequestError(DropLinkErrorMessages.InvalidTtl);

        if (request.TtlSeconds <= 0)
            throw new BadRequestError(DropLinkErrorMessages.InvalidTtl);

        // Validate delete-after-downloads
        if (request.DeleteAfterDownloads < 0 || request.DeleteAfterDownloads > _config.MaxDeleteAfterDownloads)
            throw new BadRequestError(DropLinkErrorMessages.InvalidDeleteAfterDownloads);

        // Hash password if provided
        string? passwordHash = null;
        if (!string.IsNullOrWhiteSpace(request.Password))
            passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Sanitize filename
        var safeFilename = SanitizeFilename(request.OriginalFilename);

        // Create drop (ExpiresAt is set after upload completes in CompleteUploadHandler)
        var drop = new Drop
        {
            PublicId = PublicIdGenerator.Generate(),
            InviteCodeId = invite.Id,
            TtlSeconds = request.TtlSeconds,
            DeleteAfterDownloads = request.DeleteAfterDownloads,
            OriginalFilename = safeFilename,
            ContentType = request.ContentType ?? DropLinkDefaults.FallbackMimeType,
            Status = DropStatus.Created,
            PasswordHash = passwordHash
        };

        _db.Drops.Add(drop);

        // Update invite usage
        invite.UsedDropCount++;
        invite.LastUsedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new CreateDropResponse(
            PublicId: drop.PublicId,
            DropId: drop.Id,
            TtlSeconds: drop.TtlSeconds,
            Upload: new UploadInfo(
                Protocol: "s3-multipart",
                Endpoint: $"/api/droplink/drops/{drop.Id}/upload"));
    }

    private static string SanitizeFilename(string filename)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(filename
            .Where(c => !invalidChars.Contains(c))
            .ToArray());

        if (string.IsNullOrWhiteSpace(sanitized))
            sanitized = "unnamed";

        return sanitized.Length > 200 ? sanitized[..200] : sanitized;
    }
}
