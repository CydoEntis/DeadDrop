namespace DeadDrop.Features.DropLink.Admin.GetStats;

public static class GetStatsEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/stats",
            async (GetStatsHandler handler) =>
            {
                var response = await handler.ExecuteAsync();
                return Results.Ok(response);
            });
    }
}
