namespace DeadDrop.Features.DropLink.Admin.RevokeInviteCode;

public static class RevokeInviteCodeEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/invites/{id:guid}/revoke",
            async (Guid id, RevokeInviteCodeHandler handler) =>
            {
                await handler.ExecuteAsync(id);
                return Results.Ok(new { Ok = true });
            });
    }
}
