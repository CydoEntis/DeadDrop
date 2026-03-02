using DeadDrop.Features.DropLink.Models;

namespace DeadDrop.Features.DropLink.Download;

public static class AuthorizeDownloadEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/drops/auth",
            async (DownloadAuthRequest request, AuthorizeDownloadHandler handler) =>
            {
                var response = await handler.ExecuteAsync(request.PublicId, request);
                return Results.Ok(response);
            });
    }
}
