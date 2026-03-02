using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Account.DeleteAccount;

/// <summary>
/// Endpoint mapping for DeleteAccount: DELETE /api/account
/// </summary>
public static class DeleteAccountEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapDelete("/",
            async (AppDbContext db, IFileStorageService fileStorage, HttpContext context) =>
            {
                await DeleteAccountHandler.ExecuteAsync(db, fileStorage, context);
                return new { message = "Account deleted successfully" }.Ok(context);
            });
    }
}
