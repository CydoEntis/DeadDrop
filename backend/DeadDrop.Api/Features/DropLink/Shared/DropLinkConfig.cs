using DeadDrop.Features.DropLink.Constants;

namespace DeadDrop.Features.DropLink.Shared;

public class DropLinkConfig
{
    public long MaxStorageBytes { get; set; } = DropLinkDefaults.DefaultMaxStorageBytes;
    public long MinFreeDiskBytes { get; set; } = DropLinkDefaults.DefaultMinFreeDiskBytes;
    public long MaxBytesPerDropDefault { get; set; } = DropLinkDefaults.DefaultMaxBytesPerDrop;
    public int MaxTtlSecondsGlobal { get; set; } = DropLinkDefaults.DefaultMaxTtlSecondsGlobal;
    public int MaxDeleteAfterDownloads { get; set; } = DropLinkDefaults.DefaultMaxDeleteAfterDownloads;
    public int DownloadTokenTtlSeconds { get; set; } = DropLinkDefaults.DefaultDownloadTokenTtlSeconds;
    public int CleanupIntervalMinutes { get; set; } = DropLinkDefaults.DefaultCleanupIntervalMinutes;
}
