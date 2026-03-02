namespace DeadDrop.Features.DropLink.Admin.DeleteInviteCode;

public static class DeleteInviteCodeEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapDelete("/invites/{id:guid}",
            async (Guid id, DeleteInviteCodeHandler handler) =>
            {
                await handler.ExecuteAsync(id);
                return Results.Ok(new { Ok = true });
            });
    }
}
