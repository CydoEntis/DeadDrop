using DeadDrop.Features.DropLink.Upload.Models;

namespace DeadDrop.Features.DropLink.Upload;

public static class CompleteUploadEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/{dropId:guid}/upload/complete",
            async (Guid dropId, CompleteUploadRequest request, CompleteUploadHandler handler) =>
                await handler.ExecuteAsync(dropId, request));
    }
}
