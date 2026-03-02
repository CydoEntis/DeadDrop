using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using DeadDrop.Features.DropLink.Shared;

namespace DeadDrop.Features.DropLink.Download;

public class DownloadTokenStore
{
    private readonly ConcurrentDictionary<string, DownloadTokenEntry> _tokens = new();
    private readonly int _tokenTtlSeconds;

    public DownloadTokenStore(IOptions<DropLinkConfig> config)
    {
        _tokenTtlSeconds = config.Value.DownloadTokenTtlSeconds;
    }

    public string IssueToken(string publicId)
    {
        CleanupExpired();

        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var entry = new DownloadTokenEntry(publicId, DateTime.UtcNow.AddSeconds(_tokenTtlSeconds));
        _tokens[token] = entry;

        return token;
    }

    public string? ValidateToken(string token)
    {
        if (!_tokens.TryRemove(token, out var entry))
            return null;

        if (entry.ExpiresAt < DateTime.UtcNow)
            return null;

        return entry.PublicId;
    }

    private void CleanupExpired()
    {
        var now = DateTime.UtcNow;
        var expired = _tokens.Where(kvp => kvp.Value.ExpiresAt < now).Select(kvp => kvp.Key).ToList();
        foreach (var key in expired)
            _tokens.TryRemove(key, out _);
    }

    private record DownloadTokenEntry(string PublicId, DateTime ExpiresAt);
}
