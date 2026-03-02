using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DeadDrop.Infrastructure.Data;

public class DropLinkDbContextFactory : IDesignTimeDbContextFactory<DropLinkDbContext>
{
    public DropLinkDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddUserSecrets<DropLinkDbContext>()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<DropLinkDbContext>();
        optionsBuilder.UseNpgsql(configuration.GetConnectionString("DefaultConnection"));

        return new DropLinkDbContext(optionsBuilder.Options);
    }
}
