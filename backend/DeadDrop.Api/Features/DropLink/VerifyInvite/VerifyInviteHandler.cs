using ErrorHound.BuiltIn;
using Microsoft.EntityFrameworkCore;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.VerifyInvite;

public class VerifyInviteHandler
{
    private readonly DropLinkDbContext _db;

    public VerifyInviteHandler(DropLinkDbContext db)
    {
        _db = db;
    }

    public async Task<InviteVerifyResponse> ExecuteAsync(VerifyInviteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            throw new BadRequestError(DropLinkErrorMessages.InvalidInviteCode);

        var codeHash = InviteCodeHasher.Hash(request.Code.Trim());

        var invite = await _db.InviteCodes
            .FirstOrDefaultAsync(i => i.CodeHash == codeHash);

        if (invite is null)
            throw new BadRequestError(DropLinkErrorMessages.InvalidInviteCode);

        if (invite.IsRevoked)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeRevoked);

        if (invite.ExpiresAt.HasValue && invite.ExpiresAt.Value < DateTime.UtcNow)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeExpired);

        if (invite.MaxDropCount.HasValue && invite.UsedDropCount >= invite.MaxDropCount.Value)
            throw new BadRequestError(DropLinkErrorMessages.InviteCodeDropLimitReached);

        long? remainingBytes = null;
        if (invite.MaxTotalBytes.HasValue)
        {
            remainingBytes = invite.MaxTotalBytes.Value - invite.UsedTotalBytes;
            if (remainingBytes <= 0)
                throw new BadRequestError(DropLinkErrorMessages.InviteCodeStorageLimitReached);
        }

        int? remainingDrops = null;
        if (invite.MaxDropCount.HasValue)
            remainingDrops = invite.MaxDropCount.Value - invite.UsedDropCount;

        return new InviteVerifyResponse(
            Label: invite.Label,
            Limits: new InviteLimits(
                MaxBytesPerDrop: invite.MaxBytesPerDrop,
                MaxTtlSeconds: invite.MaxTtlSeconds,
                DefaultTtlSeconds: invite.DefaultTtlSeconds,
                RemainingBytes: remainingBytes,
                RemainingDrops: remainingDrops));
    }
}
