namespace DeadDrop.Features.Account;

public static class AccountEndpoints
{
    public static void Map(WebApplication app)
    {
        var group = app.MapGroup("/api/account")
            .RequireAuthorization()
            .WithTags("Account");

        GetAccount.GetAccountEndpoint.Map(group);
        UpdateAccount.UpdateAccountEndpoint.Map(group);
        UploadAvatar.UploadAvatarEndpoint.Map(group);
        DeleteAvatar.DeleteAvatarEndpoint.Map(group);
        DeleteAccount.DeleteAccountEndpoint.Map(group);
    }
}
