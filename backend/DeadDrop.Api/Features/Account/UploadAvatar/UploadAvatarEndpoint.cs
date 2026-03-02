using Microsoft.AspNetCore.Mvc;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;
using SuccessHound.AspNetExtensions;

namespace DeadDrop.Features.Account.UploadAvatar;

/// <summary>
/// Endpoint mapping for UploadAvatar: POST /api/account/avatar
/// </summary>
public static class UploadAvatarEndpoint
{
    public static RouteHandlerBuilder Map(RouteGroupBuilder group)
    {
        return group.MapPost("/avatar",
            async ([FromForm] IFormFile file, AppDbContext db, IFileStorageService fileStorage, HttpContext context) =>
            {
                var response = await UploadAvatarHandler.ExecuteAsync(file, db, fileStorage, context);
                return response.Ok(context);
            })
            .DisableAntiforgery(); // Required for multipart/form-data
    }
}
