namespace DeadDrop.Features.DropLink.Download;

public static class DownloadDropEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/drops/{publicId}/download",
            async (string publicId, string token, DownloadDropHandler handler, HttpContext context) =>
            {
                return await handler.ExecuteAsync(publicId, token, context);
            });
    }
}
