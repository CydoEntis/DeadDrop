namespace DeadDrop.Features.DropLink.GetDropMetadata;

public static class GetDropMetadataEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/drops/{publicId}",
            async (string publicId, GetDropMetadataHandler handler) =>
            {
                var response = await handler.ExecuteAsync(publicId);
                return Results.Ok(response);
            });
    }
}
