namespace DeadDrop.Features.DropLink.VerifyInvite;

public static class VerifyInviteEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/invites/verify",
            async (VerifyInviteRequest request, VerifyInviteHandler handler) =>
            {
                var response = await handler.ExecuteAsync(request);
                return Results.Ok(response);
            });
    }
}

public record VerifyInviteRequest(string Code);
