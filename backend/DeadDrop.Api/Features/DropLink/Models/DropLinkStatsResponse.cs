namespace DeadDrop.Features.DropLink.Models;

public record DropLinkStatsResponse(
    long TotalStorageUsedBytes,
    int ActiveDropsCount,
    int TotalDownloads24h,
    int TotalDownloads7d,
    int TotalDownloads30d,
    long TotalBytesTransferred,
    int ActiveInviteCodesCount,
    int TotalInviteCodesCount);
