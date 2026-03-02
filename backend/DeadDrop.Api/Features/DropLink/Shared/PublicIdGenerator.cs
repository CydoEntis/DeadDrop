using System.Security.Cryptography;
using DeadDrop.Features.DropLink.Constants;

namespace DeadDrop.Features.DropLink.Shared;

public static class PublicIdGenerator
{
    private const string Base62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    public static string Generate(int length = DropLinkDefaults.PublicIdLength)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        var chars = new char[length];

        for (var i = 0; i < length; i++)
        {
            chars[i] = Base62Chars[bytes[i] % Base62Chars.Length];
        }

        return new string(chars);
    }

    public static string GenerateInviteCode()
    {
        var segments = new string[4];
        for (var i = 0; i < 4; i++)
        {
            var bytes = RandomNumberGenerator.GetBytes(4);
            segments[i] = Convert.ToHexString(bytes).ToUpperInvariant();
        }

        return string.Join("-", segments);
    }
}
