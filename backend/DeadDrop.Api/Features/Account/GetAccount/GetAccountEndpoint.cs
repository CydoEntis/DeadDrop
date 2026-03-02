using DeadDrop.Infrastructure.Data;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Account.GetAccount;

/// <summary>
/// Endpoint mapping for GetAccount: GET /api/account
/// </summary>
public static class GetAccountEndpoint
{
    /// <summary>
    /// Maps the GET /api/account endpoint.
    /// </summary>
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/", async (AppDbContext db, IConfiguration config, HttpContext context) =>
        {
            var response = await GetAccountHandler.ExecuteAsync(db, config, context);
            return response.Ok(context);  // SuccessHound formats response
        });
    }
}
