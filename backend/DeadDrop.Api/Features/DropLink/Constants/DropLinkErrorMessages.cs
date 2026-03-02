namespace DeadDrop.Features.DropLink.Constants;

public static class DropLinkErrorMessages
{
    // Invite codes
    public const string InvalidInviteCode = "Invalid or expired invite code";
    public const string InviteCodeRevoked = "This invite code has been revoked";
    public const string InviteCodeExpired = "This invite code has expired";
    public const string InviteCodeDropLimitReached = "This invite code has reached its maximum number of drops";
    public const string InviteCodeStorageLimitReached = "This invite code has reached its storage limit";
    public const string InviteCodeNotFound = "Invite code not found";

    // Drops
    public const string DropNotFound = "Drop not found";
    public const string DropExpired = "This drop has expired";
    public const string DropNotReady = "This drop is not ready for download";
    public const string DropDeleted = "This file has been deleted";
    public const string InvalidTtl = "TTL exceeds the maximum allowed value";
    public const string InvalidDeleteAfterDownloads = "Delete-after-downloads value is out of range";
    public const string FileTooLarge = "File size exceeds the maximum allowed size for this invite code";

    // Downloads
    public const string InvalidPassword = "Incorrect password";
    public const string InvalidDownloadToken = "Invalid or expired download token";
    public const string DownloadLimitReached = "This file has reached its download limit";

    // Quotas
    public const string GlobalStorageLimitReached = "Server storage limit has been reached";
    public const string InsufficientDiskSpace = "Insufficient disk space on server";
    public const string UploadTooLarge = "File size exceeds the maximum allowed per drop";
}
