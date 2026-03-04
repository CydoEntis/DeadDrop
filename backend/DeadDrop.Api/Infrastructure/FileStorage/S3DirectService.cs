using Amazon.S3;
using Amazon.S3.Model;

namespace DeadDrop.Infrastructure.FileStorage;

public class S3DirectService
{
    private readonly AmazonS3Client _client;
    private readonly string _bucketName;

    public S3DirectService(IConfiguration config)
    {
        var s3 = config.GetSection("StashPup:S3");
        _bucketName = s3["BucketName"] ?? "deaddrop";

        var s3Config = new AmazonS3Config
        {
            ServiceURL = s3["ServiceUrl"] ?? "",
            ForcePathStyle = s3.GetValue<bool>("ForcePathStyle", true),
            AuthenticationRegion = s3["Region"] ?? "garage"
        };

        _client = new AmazonS3Client(
            s3["AccessKeyId"] ?? "",
            s3["SecretAccessKey"] ?? "",
            s3Config);
    }

    public async Task<string> InitiateMultipartUploadAsync(string key, string contentType, CancellationToken ct = default)
    {
        var request = new InitiateMultipartUploadRequest
        {
            BucketName = _bucketName,
            Key = key,
            ContentType = contentType
        };

        var response = await _client.InitiateMultipartUploadAsync(request, ct);
        return response.UploadId;
    }

    public string GeneratePresignedPartUrl(string key, string uploadId, int partNumber)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddHours(2),
            UploadId = uploadId,
            PartNumber = partNumber
        };

        return _client.GetPreSignedURL(request);
    }

    public async Task CompleteMultipartUploadAsync(string key, string uploadId, List<PartETag> parts, CancellationToken ct = default)
    {
        var request = new CompleteMultipartUploadRequest
        {
            BucketName = _bucketName,
            Key = key,
            UploadId = uploadId,
            PartETags = parts
        };

        await _client.CompleteMultipartUploadAsync(request, ct);
    }

    public async Task AbortMultipartUploadAsync(string key, string uploadId, CancellationToken ct = default)
    {
        var request = new AbortMultipartUploadRequest
        {
            BucketName = _bucketName,
            Key = key,
            UploadId = uploadId
        };

        await _client.AbortMultipartUploadAsync(request, ct);
    }

    public async Task<Stream> GetObjectStreamAsync(string key, CancellationToken ct = default)
    {
        var response = await _client.GetObjectAsync(_bucketName, key, ct);
        return response.ResponseStream;
    }

    public async Task<long> GetObjectSizeAsync(string key, CancellationToken ct = default)
    {
        var response = await _client.GetObjectMetadataAsync(_bucketName, key, ct);
        return response.ContentLength;
    }

    public async Task<bool> ObjectExistsAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await _client.GetObjectMetadataAsync(_bucketName, key, ct);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task DeleteObjectAsync(string key, CancellationToken ct = default)
    {
        await _client.DeleteObjectAsync(_bucketName, key, ct);
    }

    public async Task ConfigureBucketCorsAsync(string[] allowedOrigins, CancellationToken ct = default)
    {
        var corsConfig = new CORSConfiguration
        {
            Rules = allowedOrigins.Select(origin => new CORSRule
            {
                AllowedOrigins = [origin],
                AllowedMethods = ["PUT"],
                AllowedHeaders = ["*"],
                ExposeHeaders = ["ETag"],
                MaxAgeSeconds = 3600
            }).ToList()
        };

        await _client.PutCORSConfigurationAsync(new PutCORSConfigurationRequest
        {
            BucketName = _bucketName,
            Configuration = corsConfig
        }, ct);
    }
}
