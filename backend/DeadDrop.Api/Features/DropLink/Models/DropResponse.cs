using DeadDrop.Domain.Entities.DropLink;

namespace DeadDrop.Features.DropLink.Models;

public record DropMetadataResponse(
    string PublicId,
    string Status,
    string OriginalFilename,
    long? SizeBytes,
    DateTime ExpiresAt,
    bool RequiresPassword,
    int DownloadCount,
    int DeleteAfterDownloads);

public record CreateDropRequest(
    string InviteCode,
    int TtlSeconds,
    string? Password,
    int DeleteAfterDownloads,
    string OriginalFilename,
    string? ContentType);

public record CreateDropResponse(
    string PublicId,
    Guid DropId,
    DateTime ExpiresAt,
    UploadInfo Upload);

public record UploadInfo(
    string Protocol,
    string Endpoint);

public record DownloadAuthRequest(
    string PublicId,
    string? Password);

public record DownloadAuthResponse(
    string Token,
    int ExpiresInSeconds);

public record AdminDropResponse(
    Guid Id,
    string PublicId,
    string Status,
    string OriginalFilename,
    long? SizeBytes,
    DateTime CreatedAt,
    DateTime ExpiresAt,
    int DownloadCount,
    int DeleteAfterDownloads,
    string InviteCodeLabel);
