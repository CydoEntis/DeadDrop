using DeadDrop.Features.DropLink.Models;

namespace DeadDrop.Features.DropLink.CreateDrop;

public static class CreateDropEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/drops",
            async (CreateDropRequest request, CreateDropHandler handler) =>
            {
                var response = await handler.ExecuteAsync(request);
                return Results.Created($"/api/droplink/drops/{response.PublicId}", response);
            });
    }
}
