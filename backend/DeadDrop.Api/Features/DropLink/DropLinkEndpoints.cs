using DeadDrop.Features.DropLink.VerifyInvite;
using DeadDrop.Features.DropLink.CreateDrop;
using DeadDrop.Features.DropLink.GetDropMetadata;
using DeadDrop.Features.DropLink.Download;
using DeadDrop.Features.DropLink.Upload;
using DeadDrop.Features.DropLink.Admin.CreateInviteCode;
using DeadDrop.Features.DropLink.Admin.ListInviteCodes;
using DeadDrop.Features.DropLink.Admin.RevokeInviteCode;
using DeadDrop.Features.DropLink.Admin.DeleteInviteCode;
using DeadDrop.Features.DropLink.Admin.GetStats;
using DeadDrop.Features.DropLink.Admin.ListDrops;
using DeadDrop.Features.DropLink.Admin.DeleteDrop;

namespace DeadDrop.Features.DropLink;

public static class DropLinkEndpoints
{
    public static void Map(WebApplication app)
    {
        // Public endpoints (no auth required)
        var publicGroup = app.MapGroup("/api/droplink")
            .AllowAnonymous()
            .WithTags("DropLink");

        VerifyInviteEndpoint.Map(publicGroup);
        CreateDropEndpoint.Map(publicGroup);
        GetDropMetadataEndpoint.Map(publicGroup);
        AuthorizeDownloadEndpoint.Map(publicGroup);
        DownloadDropEndpoint.Map(publicGroup);

        var dropsGroup = app.MapGroup("/api/droplink/drops")
            .AllowAnonymous()
            .WithTags("DropLink Upload");

        InitiateUploadEndpoint.Map(dropsGroup);
        PresignPartsEndpoint.Map(dropsGroup);
        CompleteUploadEndpoint.Map(dropsGroup);
        AbortUploadEndpoint.Map(dropsGroup);

        // Admin endpoints (require Pawthorize admin auth)
        var adminGroup = app.MapGroup("/api/droplink/admin")
            .RequireAuthorization(policy => policy.RequireRole("Admin"))
            .WithTags("DropLink Admin");

        CreateInviteCodeEndpoint.Map(adminGroup);
        ListInviteCodesEndpoint.Map(adminGroup);
        RevokeInviteCodeEndpoint.Map(adminGroup);
        DeleteInviteCodeEndpoint.Map(adminGroup);
        GetStatsEndpoint.Map(adminGroup);
        ListDropsEndpoint.Map(adminGroup);
        DeleteDropEndpoint.Map(adminGroup);
    }
}
