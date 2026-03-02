namespace DeadDrop.Features.DropLink.Constants;

public static class DropLinkDefaults
{
    public const int PublicIdLength = 22;
    public const string FallbackMimeType = "application/octet-stream";

    // TTL presets in seconds
    public const int Ttl15Minutes = 900;
    public const int Ttl1Hour = 3600;
    public const int Ttl1Day = 86400;
    public const int Ttl1Week = 604800;
    public const int Ttl1Month = 2592000;

    // Global defaults
    public const long DefaultMaxStorageBytes = 2L * 1024 * 1024 * 1024 * 1024; // 2 TB
    public const long DefaultMinFreeDiskBytes = 1L * 1024 * 1024 * 1024; // 1 GB
    public const long DefaultMaxBytesPerDrop = 50L * 1024 * 1024 * 1024; // 50 GB
    public const int DefaultMaxTtlSecondsGlobal = 2592000; // 30 days
    public const int DefaultMaxDeleteAfterDownloads = 5;
    public const int DefaultDownloadTokenTtlSeconds = 600; // 10 minutes
    public const int DefaultCleanupIntervalMinutes = 5;
    public const int AbandonedUploadHours = 24;
    public const int DownloadEventRetentionDays = 90;
}
