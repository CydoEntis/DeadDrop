namespace DeadDrop.Domain.Entities.DropLink;

public class Drop
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string PublicId { get; set; } = string.Empty;
    public Guid InviteCodeId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public int DeleteAfterDownloads { get; set; } = 1;
    public int DownloadCount { get; set; }

    // File metadata
    public string OriginalFilename { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long? SizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public Guid? StorageFileId { get; set; }
    public DropStatus Status { get; set; } = DropStatus.Created;

    // Password
    public string? PasswordHash { get; set; }

    // tus upload tracking
    public string? TusFileId { get; set; }

    // Navigation
    public DropLinkInviteCode InviteCode { get; set; } = null!;
    public ICollection<DownloadEvent> DownloadEvents { get; set; } = new List<DownloadEvent>();
}
