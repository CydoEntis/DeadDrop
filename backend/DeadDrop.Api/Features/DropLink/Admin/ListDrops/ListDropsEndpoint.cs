namespace DeadDrop.Features.DropLink.Admin.ListDrops;

public static class ListDropsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/drops",
            async (int? page, int? pageSize, string? status, ListDropsHandler handler) =>
            {
                var response = await handler.ExecuteAsync(page ?? 1, pageSize ?? 20, status);
                return Results.Ok(response);
            });
    }
}
