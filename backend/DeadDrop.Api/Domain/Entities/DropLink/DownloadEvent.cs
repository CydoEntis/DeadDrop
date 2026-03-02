namespace DeadDrop.Domain.Entities.DropLink;

public class DownloadEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DropId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public long BytesSent { get; set; }
    public bool WasSuccess { get; set; }

    // Navigation
    public Drop Drop { get; set; } = null!;
}
