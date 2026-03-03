using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Download;

public class AuthorizeDownloadHandler
{
    private readonly DropLinkDbContext _db;
    private readonly DownloadTokenStore _tokenStore;
    private readonly DropLinkConfig _config;

    public AuthorizeDownloadHandler(DropLinkDbContext db, DownloadTokenStore tokenStore, IOptions<DropLinkConfig> config)
    {
        _db = db;
        _tokenStore = tokenStore;
        _config = config.Value;
    }

    public async Task<DownloadAuthResponse> ExecuteAsync(string publicId, DownloadAuthRequest request)
    {
        var drop = await _db.Drops
            .FirstOrDefaultAsync(d => d.PublicId == publicId);

        if (drop is null)
            throw new NotFoundError(DropLinkErrorMessages.DropNotFound);

        if (drop.Status != DropStatus.Ready)
            throw new BadRequestError(DropLinkErrorMessages.DropNotReady);

        if (drop.ExpiresAt.HasValue && drop.ExpiresAt < DateTime.UtcNow)
            throw new NotFoundError(DropLinkErrorMessages.DropExpired);

        if (drop.DeleteAfterDownloads > 0 && drop.DownloadCount >= drop.DeleteAfterDownloads)
            throw new NotFoundError(DropLinkErrorMessages.DownloadLimitReached);

        // Validate password if required
        if (drop.PasswordHash is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Password))
                throw new BadRequestError(DropLinkErrorMessages.InvalidPassword);

            if (!BCrypt.Net.BCrypt.Verify(request.Password, drop.PasswordHash))
                throw new BadRequestError(DropLinkErrorMessages.InvalidPassword);
        }

        // Issue download token
        var token = _tokenStore.IssueToken(publicId);

        return new DownloadAuthResponse(
            Token: token,
            ExpiresInSeconds: _config.DownloadTokenTtlSeconds);
    }
}
