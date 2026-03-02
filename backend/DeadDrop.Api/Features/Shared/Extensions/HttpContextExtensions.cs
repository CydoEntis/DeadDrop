using System.Security.Claims;
using ErrorHound.BuiltIn;

namespace DeadDrop.Features.Shared.Extensions;

public static class HttpContextExtensions
{
    public static string GetCurrentUserId(this HttpContext context)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            throw new UnauthorizedError("User not authenticated");
        return userId;
    }
}