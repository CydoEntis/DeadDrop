using DeadDrop.Features.DropLink.Models;

namespace DeadDrop.Features.DropLink.Admin.CreateInviteCode;

public static class CreateInviteCodeEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/invites",
            async (CreateInviteCodeRequest request, CreateInviteCodeHandler handler) =>
            {
                var response = await handler.ExecuteAsync(request);
                return Results.Created($"/api/droplink/admin/invites/{response.Id}", response);
            });
    }
}
