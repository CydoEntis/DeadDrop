namespace DeadDrop.Features.DropLink.Models;

public record InviteCodeResponse(
    Guid Id,
    string Code,
    string Label,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    bool IsRevoked,
    long? MaxTotalBytes,
    int? MaxDropCount,
    long? MaxBytesPerDrop,
    int? DefaultTtlSeconds,
    int? MaxTtlSeconds,
    long UsedTotalBytes,
    int UsedDropCount,
    DateTime? LastUsedAt);

public record InviteVerifyResponse(
    string Label,
    InviteLimits Limits);

public record InviteLimits(
    long? MaxBytesPerDrop,
    int? MaxTtlSeconds,
    int? DefaultTtlSeconds,
    long? RemainingBytes,
    int? RemainingDrops);

public record CreateInviteCodeRequest(
    string Label,
    long? MaxTotalBytes);

public record CreateInviteCodeResponse(
    string InviteCode,
    Guid Id);
