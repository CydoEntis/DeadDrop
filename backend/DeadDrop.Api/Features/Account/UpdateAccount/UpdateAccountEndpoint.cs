using DeadDrop.Infrastructure.Data;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Account.UpdateAccount;

/// <summary>
/// Endpoint mapping for UpdateAccount: PUT /api/account
/// </summary>
public static class UpdateAccountEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPut("/",
            async (AppDbContext db, HttpContext context, IConfiguration config, UpdateAccountRequest request) =>
            {
                var response = await UpdateAccountHandler.ExecuteAsync(db, context, config, request);
                return response.Ok(context);
            });
    }
}
