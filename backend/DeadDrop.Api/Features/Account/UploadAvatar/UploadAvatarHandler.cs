using ErrorHound.BuiltIn;
using Microsoft.AspNetCore.Mvc;
using DeadDrop.Features.Shared.Extensions;
using DeadDrop.Infrastructure.Data;
using DeadDrop.Infrastructure.FileStorage;

namespace DeadDrop.Features.Account.UploadAvatar;

/// <summary>
/// Handler for UploadAvatar operation.
/// Contains business logic for uploading user avatar.
/// </summary>
public static class UploadAvatarHandler
{
    public static async Task<AvatarUploadResponse> ExecuteAsync(
        IFormFile file,
        AppDbContext db,
        IFileStorageService fileStorage,
        HttpContext context)
    {
        var user = await db.GetCurrentUserAsync(context);

        if (file.Length == 0)
            throw new BadRequestError("File is empty");

        if (user.AvatarFileId.HasValue)
            await fileStorage.DeleteAvatarAsync(user.AvatarFileId.Value);

        await using var stream = file.OpenReadStream();
        var result = await fileStorage.UploadAvatarAsync(stream, file.FileName, user.Id);

        if (!result.Success)
            throw new BadRequestError(result.ErrorMessage ?? "Failed to upload avatar");

        user.AvatarFileId = result.FileId;
        user.AvatarUrl = result.Url;
        await db.SaveChangesAsync();

        return new AvatarUploadResponse(user.AvatarUrl!);
    }
}

public record AvatarUploadResponse(string Url);
