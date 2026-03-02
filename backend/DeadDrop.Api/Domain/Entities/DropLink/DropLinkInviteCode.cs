namespace DeadDrop.Domain.Entities.DropLink;

public class DropLinkInviteCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }

    // Limits
    public long? MaxTotalBytes { get; set; }
    public int? MaxDropCount { get; set; }
    public long? MaxBytesPerDrop { get; set; }
    public int? DefaultTtlSeconds { get; set; }
    public int? MaxTtlSeconds { get; set; }

    // Usage tracking
    public long UsedTotalBytes { get; set; }
    public int UsedDropCount { get; set; }
    public DateTime? LastUsedAt { get; set; }

    // Navigation
    public ICollection<Drop> Drops { get; set; } = new List<Drop>();
}
