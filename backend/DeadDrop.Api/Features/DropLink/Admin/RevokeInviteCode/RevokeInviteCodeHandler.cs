using ErrorHound.BuiltIn;
using DeadDrop.Features.DropLink.Constants;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Admin.RevokeInviteCode;

public class RevokeInviteCodeHandler
{
    private readonly DropLinkDbContext _db;

    public RevokeInviteCodeHandler(DropLinkDbContext db)
    {
        _db = db;
    }

    public async Task ExecuteAsync(Guid id)
    {
        var invite = await _db.InviteCodes.FindAsync(id);

        if (invite is null)
            throw new NotFoundError(DropLinkErrorMessages.InviteCodeNotFound);

        invite.IsRevoked = true;
        await _db.SaveChangesAsync();
    }
}
