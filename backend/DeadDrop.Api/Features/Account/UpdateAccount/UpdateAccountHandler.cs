using ErrorHound.BuiltIn;
using DeadDrop.Domain.Entities;
using DeadDrop.Features.Account.Mappers;
using DeadDrop.Features.Account.Models;
using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;

namespace DeadDrop.Features.Account.UpdateAccount;

/// <summary>
/// Handler for UpdateAccount operation.
/// Contains business logic for updating user account.
/// </summary>
public static class UpdateAccountHandler
{
    public static async Task<AccountResponse> ExecuteAsync(
        AppDbContext db,
        HttpContext context,
        IConfiguration config,
        UpdateAccountRequest request)
    {
        var user = await db.GetCurrentUserAsync(context);

        await ApplyUpdatesAsync(user, request, db);

        var requiresEmailVerification = config.RequiresEmailVerification();
        return user.ToAccountResponse(requiresEmailVerification);
    }

    private static async Task ApplyUpdatesAsync(
        User user,
        UpdateAccountRequest request,
        AppDbContext db)
    {
        if (request.FirstName is not null && string.IsNullOrWhiteSpace(request.FirstName))
            throw new BadRequestError("First name cannot be empty.");

        if (request.LastName is not null && string.IsNullOrWhiteSpace(request.LastName))
            throw new BadRequestError("Last name cannot be empty.");

        if (request.FirstName is not null)
            user.FirstName = request.FirstName;

        if (request.LastName is not null)
            user.LastName = request.LastName;

        await db.SaveChangesAsync();
    }
}
