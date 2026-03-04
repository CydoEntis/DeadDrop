using DeadDrop.Features.DropLink.Upload.Models;

namespace DeadDrop.Features.DropLink.Upload;

public static class AbortUploadEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/{dropId:guid}/upload/abort",
            async (Guid dropId, AbortUploadRequest request, AbortUploadHandler handler) =>
                await handler.ExecuteAsync(dropId, request));
    }
}
