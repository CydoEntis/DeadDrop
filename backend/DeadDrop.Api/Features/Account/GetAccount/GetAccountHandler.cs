using DeadDrop.Infrastructure.Data;
using DeadDrop.Features.Account.Mappers;
using DeadDrop.Features.Account.Models;
using DeadDrop.Features.Shared.Extensions;

namespace DeadDrop.Features.Account.GetAccount;

/// <summary>
/// Handler for GetAccount operation.
/// Contains business logic for retrieving user account.
/// </summary>
public static class GetAccountHandler
{
    /// <summary>
    /// Executes the GetAccount operation.
    /// Retrieves current authenticated user and maps to AccountResponse.
    /// </summary>
    public static async Task<AccountResponse> ExecuteAsync(
        AppDbContext db,
        IConfiguration config,
        HttpContext context)
    {
        var user = await db.GetCurrentUserAsync(context);
        var requiresEmailVerification = config.RequiresEmailVerification();
        return user.ToAccountResponse(requiresEmailVerification);
    }
}
