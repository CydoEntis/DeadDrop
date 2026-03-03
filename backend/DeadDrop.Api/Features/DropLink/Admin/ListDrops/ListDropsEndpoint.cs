namespace DeadDrop.Features.DropLink.Admin.ListDrops;

public static class ListDropsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/drops",
            async (int? page, int? pageSize, string? status, string? searchTerm, ListDropsHandler handler) =>
            {
                var response = await handler.ExecuteAsync(page ?? 1, pageSize ?? 20, status, searchTerm);
                return Results.Ok(response);
            });
    }
}
