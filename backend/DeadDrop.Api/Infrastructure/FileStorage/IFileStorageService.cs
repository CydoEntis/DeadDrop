namespace DeadDrop.Infrastructure.FileStorage;

public interface IFileStorageService
{
    Task<FileUploadResult> UploadAvatarAsync(Stream fileStream, string fileName, string userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAvatarAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<FileDownloadResult?> GetAvatarAsync(Guid fileId, CancellationToken cancellationToken = default);
}

public record FileUploadResult(
    bool Success,
    Guid? FileId = null,
    string? Url = null,
    string? ErrorMessage = null
);

public record FileDownloadResult(
    Stream FileStream,
    string ContentType,
    string FileName
);
