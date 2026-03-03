namespace DeadDrop.Features.DropLink.Admin.ListInviteCodes;

public static class ListInviteCodesEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapGet("/invites",
            async (int? page, int? pageSize, string? searchTerm, string? status, string? sortBy, ListInviteCodesHandler handler) =>
            {
                var response = await handler.ExecuteAsync(page ?? 1, pageSize ?? 20, searchTerm, status, sortBy);
                return Results.Ok(response);
            });
    }
}
