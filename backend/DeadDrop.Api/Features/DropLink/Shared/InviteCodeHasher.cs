using System.Security.Cryptography;
using System.Text;

namespace DeadDrop.Features.DropLink.Shared;

public static class InviteCodeHasher
{
    public static string Hash(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
