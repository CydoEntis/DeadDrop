using Pawthorize.Abstractions;

namespace DeadDrop.Domain.Entities;

public class Token
{
    public int Id { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public TokenType TokenType { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsInvalidated { get; set; }

    public User? User { get; set; }
}
