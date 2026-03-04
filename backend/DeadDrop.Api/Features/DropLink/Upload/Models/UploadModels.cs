namespace DeadDrop.Features.DropLink.Upload.Models;

public record InitiateUploadResponse(
    string UploadId,
    string Key,
    long PartSize);

public record PresignPartsRequest(
    string UploadId,
    int[] PartNumbers);

public record PresignedPart(
    int PartNumber,
    string Url);

public record PresignPartsResponse(
    PresignedPart[] Parts);

public record CompletePart(
    int PartNumber,
    string ETag);

public record CompleteUploadRequest(
    string UploadId,
    CompletePart[] Parts);

public record AbortUploadRequest(
    string UploadId);
