using ErrorHound.BuiltIn;
using DeadDrop.Domain.Entities.DropLink;
using DeadDrop.Features.DropLink.Models;
using DeadDrop.Features.DropLink.Shared;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.DropLink.Admin.CreateInviteCode;

public class CreateInviteCodeHandler
{
    private readonly DropLinkDbContext _db;

    public CreateInviteCodeHandler(DropLinkDbContext db)
    {
        _db = db;
    }

    public async Task<CreateInviteCodeResponse> ExecuteAsync(CreateInviteCodeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Label))
            throw new BadRequestError("Label is required");

        // Generate plaintext code (shown to admin once)
        var plaintextCode = PublicIdGenerator.GenerateInviteCode();
        var codeHash = InviteCodeHasher.Hash(plaintextCode);

        var inviteCode = new DropLinkInviteCode
        {
            Code = plaintextCode,
            CodeHash = codeHash,
            Label = request.Label.Trim(),
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            MaxTotalBytes = request.MaxTotalBytes,
            MaxDropCount = 1,
            MaxBytesPerDrop = request.MaxTotalBytes,
        };

        _db.InviteCodes.Add(inviteCode);
        await _db.SaveChangesAsync();

        return new CreateInviteCodeResponse(
            InviteCode: plaintextCode,
            Id: inviteCode.Id);
    }
}
