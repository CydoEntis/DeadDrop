namespace DeadDrop.Features.DropLink.Admin.DeleteDrop;

public static class DeleteDropEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapDelete("/drops/{id:guid}",
            async (Guid id, DeleteDropHandler handler) =>
            {
                await handler.ExecuteAsync(id);
                return Results.Ok(new { Ok = true });
            });
    }
}
