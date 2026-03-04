namespace DeadDrop.Features.DropLink.Upload;

public static class InitiateUploadEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/{dropId:guid}/upload/init",
            async (Guid dropId, InitiateUploadHandler handler) =>
                await handler.ExecuteAsync(dropId));
    }
}
