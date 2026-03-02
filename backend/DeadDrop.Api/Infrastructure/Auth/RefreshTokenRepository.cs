using Microsoft.EntityFrameworkCore;
using Pawthorize.Abstractions;
using Pawthorize.Services.Models;
using DeadDrop.Domain.Entities;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Infrastructure.Auth;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly AppDbContext _context;

    public RefreshTokenRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task StoreAsync(string tokenHash, string userId, DateTime expiresAt,
        string? deviceInfo = null, string? ipAddress = null, bool isRememberedSession = false,
        CancellationToken cancellationToken = default)
    {
        var refreshToken = new RefreshToken
        {
            TokenHash = tokenHash,
            UserId = userId,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false,
            DeviceInfo = deviceInfo,
            IpAddress = ipAddress,
            LastActivityAt = DateTime.UtcNow,
            IsRememberedSession = isRememberedSession
        };

        await _context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateLastActivityAsync(string tokenHash, DateTime lastActivityAt,
        CancellationToken cancellationToken = default)
    {
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (token != null)
        {
            token.LastActivityAt = lastActivityAt;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<RefreshTokenInfo?> ValidateAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (token == null)
        {
            return null;
        }

        token.LastActivityAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new RefreshTokenInfo(
            token.TokenHash,
            token.UserId,
            token.ExpiresAt,
            token.IsRevoked,
            token.CreatedAt,
            token.DeviceInfo,
            token.IpAddress,
            token.LastActivityAt,
            token.IsRememberedSession
        );
    }

    public async Task RevokeAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (token != null)
        {
            token.IsRevoked = true;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task RevokeAllForUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<RefreshTokenInfo>> GetAllActiveAsync(string userId, CancellationToken cancellationToken = default)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        return tokens.Select(t => new RefreshTokenInfo(
            t.TokenHash,
            t.UserId,
            t.ExpiresAt,
            t.IsRevoked,
            t.CreatedAt,
            t.DeviceInfo,
            t.IpAddress,
            t.LastActivityAt,
            t.IsRememberedSession
        ));
    }

    public async Task RevokeAllExceptAsync(string userId, string exceptTokenHash,
        CancellationToken cancellationToken = default)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && t.TokenHash != exceptTokenHash && !t.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}