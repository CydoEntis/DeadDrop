using Microsoft.EntityFrameworkCore;
using Pawthorize.Abstractions;
using DeadDrop.Domain.Entities;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Infrastructure.Auth;

public class ExternalAuthRepository : IExternalAuthRepository<User>
{
    private readonly AppDbContext _context;

    public ExternalAuthRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> FindByExternalProviderAsync(string provider, string providerUserId, CancellationToken cancellationToken = default)
    {
        var externalAuth = await _context.ExternalAuths
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Provider == provider && e.ProviderUserId == providerUserId, cancellationToken);

        return externalAuth?.User;
    }

    public async Task<bool> IsProviderLinkedAsync(string userId, string provider, CancellationToken cancellationToken = default)
    {
        return await _context.ExternalAuths
            .AnyAsync(e => e.UserId == userId && e.Provider == provider, cancellationToken);
    }

    public async Task<bool> IsProviderLinkedToAnotherUserAsync(string provider, string providerUserId, string excludeUserId, CancellationToken cancellationToken = default)
    {
        return await _context.ExternalAuths
            .AnyAsync(e => e.Provider == provider && e.ProviderUserId == providerUserId && e.UserId != excludeUserId, cancellationToken);
    }

    public async Task LinkExternalProviderAsync(string userId, IExternalIdentity externalIdentity, CancellationToken cancellationToken = default)
    {
        var externalAuth = new ExternalAuth
        {
            UserId = userId,
            Provider = externalIdentity.Provider,
            ProviderUserId = externalIdentity.ProviderId,
            Email = externalIdentity.ProviderEmail,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };

        await _context.ExternalAuths.AddAsync(externalAuth, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UnlinkExternalProviderAsync(string userId, string provider, CancellationToken cancellationToken = default)
    {
        var externalAuth = await _context.ExternalAuths
            .FirstOrDefaultAsync(e => e.UserId == userId && e.Provider == provider, cancellationToken);

        if (externalAuth != null)
        {
            _context.ExternalAuths.Remove(externalAuth);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IEnumerable<IExternalIdentity>> GetLinkedProvidersAsync(string userId, CancellationToken cancellationToken = default)
    {
        var externalAuths = await _context.ExternalAuths
            .Where(e => e.UserId == userId)
            .ToListAsync(cancellationToken);

        return externalAuths.Select(e => new ExternalIdentity
        {
            Provider = e.Provider,
            ProviderId = e.ProviderUserId,
            ProviderEmail = e.Email,
            ProviderUsername = null,
            LinkedAt = e.CreatedAt
        });
    }

    public async Task<int> GetLinkedProviderCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.ExternalAuths
            .CountAsync(e => e.UserId == userId, cancellationToken);
    }

    public async Task UpdateLastLoginAsync(string userId, string provider, CancellationToken cancellationToken = default)
    {
        var externalAuth = await _context.ExternalAuths
            .FirstOrDefaultAsync(e => e.UserId == userId && e.Provider == provider, cancellationToken);

        if (externalAuth != null)
        {
            externalAuth.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}

public class ExternalIdentity : IExternalIdentity
{
    public string Provider { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public string? ProviderEmail { get; set; }
    public string? ProviderUsername { get; set; }
    public DateTime LinkedAt { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
}
