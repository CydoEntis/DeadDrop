using Microsoft.EntityFrameworkCore;
using Pawthorize.Abstractions;
using DeadDrop.Domain.Entities;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Infrastructure.Auth;

public class TokenRepository : ITokenRepository
{
    private readonly AppDbContext _context;

    public TokenRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task StoreTokenAsync(string userId, string tokenHash, TokenType tokenType, DateTime expiresAt,
        CancellationToken cancellationToken = default)
    {
        var token = new Token
        {
            TokenHash = tokenHash,
            UserId = userId,
            TokenType = tokenType,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow,
            IsInvalidated = false
        };

        await _context.Tokens.AddAsync(token, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<TokenInfo?> ValidateTokenAsync(string tokenHash, TokenType tokenType,
        CancellationToken cancellationToken = default)
    {
        var token = await _context.Tokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.TokenType == tokenType, cancellationToken);

        if (token == null || token.IsInvalidated || token.ExpiresAt < DateTime.UtcNow)
        {
            return null;
        }

        return new TokenInfo(token.UserId, token.CreatedAt, token.ExpiresAt);
    }

    public async Task<TokenInfo?> ConsumeTokenAsync(string tokenHash, TokenType tokenType,
        CancellationToken cancellationToken = default)
    {
        var token = await _context.Tokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.TokenType == tokenType, cancellationToken);

        if (token == null || token.IsInvalidated || token.ExpiresAt < DateTime.UtcNow)
        {
            return null;
        }

        token.IsInvalidated = true;
        await _context.SaveChangesAsync(cancellationToken);

        return new TokenInfo(token.UserId, token.CreatedAt, token.ExpiresAt);
    }

    public async Task InvalidateTokenAsync(string tokenHash, TokenType tokenType,
        CancellationToken cancellationToken = default)
    {
        var token = await _context.Tokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.TokenType == tokenType, cancellationToken);

        if (token != null)
        {
            token.IsInvalidated = true;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task InvalidateAllTokensForUserAsync(string userId, TokenType tokenType,
        CancellationToken cancellationToken = default)
    {
        var tokens = await _context.Tokens
            .Where(t => t.UserId == userId && t.TokenType == tokenType && !t.IsInvalidated)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.IsInvalidated = true;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}