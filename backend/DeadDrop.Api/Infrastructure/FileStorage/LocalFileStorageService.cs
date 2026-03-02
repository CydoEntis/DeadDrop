using DeadDrop.Features.Shared.Constants;

namespace DeadDrop.Infrastructure.FileStorage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly long _maxFileSizeBytes;
    private readonly string[] _allowedExtensions;
    private readonly ILogger<LocalFileStorageService> _logger;

    public LocalFileStorageService(IConfiguration configuration, ILogger<LocalFileStorageService> logger)
    {
        _logger = logger;
        _basePath = configuration["FileStorage:BasePath"] ?? "./wwwroot/avatars";
        _maxFileSizeBytes = configuration.GetValue<long>("FileStorage:MaxFileSizeBytes", 5 * 1024 * 1024); // 5MB default
        _allowedExtensions = configuration.GetSection("FileStorage:AllowedExtensions").Get<string[]>() 
            ?? [".jpg", ".jpeg", ".png", ".gif", ".webp"];

        Directory.CreateDirectory(_basePath);
    }

    public async Task<FileUploadResult> UploadAvatarAsync(
        Stream fileStream,
        string fileName,
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (fileStream.Length > _maxFileSizeBytes)
            {
                return new FileUploadResult(false, ErrorMessage: $"File size exceeds maximum allowed size of {_maxFileSizeBytes / 1024 / 1024}MB");
            }

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(extension))
            {
                return new FileUploadResult(false, ErrorMessage: $"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}");
            }

            var fileId = Guid.NewGuid();
            var sanitizedFileName = $"{fileId}{extension}";
            var userFolder = Path.Combine(_basePath, $"user-{userId}");
            Directory.CreateDirectory(userFolder);

            var filePath = Path.Combine(userFolder, sanitizedFileName);

            await using var fileStreamDest = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
            await fileStream.CopyToAsync(fileStreamDest, cancellationToken);

            var url = $"/avatars/user-{userId}/{sanitizedFileName}";
            
            _logger.LogInformation("Avatar uploaded successfully for user {UserId}: {FileId}", userId, fileId);
            
            return new FileUploadResult(true, fileId, url);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar for user {UserId}", userId);
            return new FileUploadResult(false, ErrorMessage: "An error occurred while uploading the file");
        }
    }

    public Task<bool> DeleteAvatarAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        try
        {
            var userFolders = Directory.GetDirectories(_basePath, "user-*");
            
            foreach (var userFolder in userFolders)
            {
                var files = Directory.GetFiles(userFolder, $"{fileId}.*");
                
                foreach (var file in files)
                {
                    File.Delete(file);
                    _logger.LogInformation("Avatar deleted: {FileId}", fileId);
                    return Task.FromResult(true);
                }
            }

            _logger.LogWarning("Avatar not found for deletion: {FileId}", fileId);
            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting avatar {FileId}", fileId);
            return Task.FromResult(false);
        }
    }

    public Task<FileDownloadResult?> GetAvatarAsync(Guid fileId, CancellationToken cancellationToken = default)
    {
        try
        {
            var userFolders = Directory.GetDirectories(_basePath, "user-*");
            
            foreach (var userFolder in userFolders)
            {
                var files = Directory.GetFiles(userFolder, $"{fileId}.*");
                
                if (files.Length > 0)
                {
                    var filePath = files[0];
                    var extension = Path.GetExtension(filePath).ToLowerInvariant();
                    var contentType = GetContentType(extension);
                    var fileName = Path.GetFileName(filePath);
                    
                    var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                    
                    return Task.FromResult<FileDownloadResult?>(new FileDownloadResult(fileStream, contentType, fileName));
                }
            }

            return Task.FromResult<FileDownloadResult?>(null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving avatar {FileId}", fileId);
            return Task.FromResult<FileDownloadResult?>(null);
        }
    }

    private static string GetContentType(string extension) => extension switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        _ => DomainDefaults.FallbackMimeType
    };
}
