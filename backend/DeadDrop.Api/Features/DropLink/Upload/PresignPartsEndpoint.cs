using DeadDrop.Features.DropLink.Upload.Models;

namespace DeadDrop.Features.DropLink.Upload;

public static class PresignPartsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/{dropId:guid}/upload/presign",
            async (Guid dropId, PresignPartsRequest request, PresignPartsHandler handler) =>
                await handler.ExecuteAsync(dropId, request));
    }
}
