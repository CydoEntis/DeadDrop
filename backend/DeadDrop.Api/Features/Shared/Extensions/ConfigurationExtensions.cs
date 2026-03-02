namespace DeadDrop.Features.Shared.Extensions;

public static class ConfigurationExtensions
{
    public static bool RequiresEmailVerification(this IConfiguration config) =>
        config.GetValue<bool>("Pawthorize:RequireEmailVerification");
}