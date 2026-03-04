using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using DeadDrop.Domain.Entities.DropLink;

namespace DeadDrop.Infrastructure.Data;

internal class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeConverter() : base(
        v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
    { }
}

internal class UtcNullableDateTimeConverter : ValueConverter<DateTime?, DateTime?>
{
    public UtcNullableDateTimeConverter() : base(
        v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : v,
        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v)
    { }
}

public class DropLinkDbContext : DbContext
{
    public DropLinkDbContext(DbContextOptions<DropLinkDbContext> options)
        : base(options)
    {
    }

    public DbSet<DropLinkInviteCode> InviteCodes => Set<DropLinkInviteCode>();
    public DbSet<Drop> Drops => Set<Drop>();
    public DbSet<DownloadEvent> DownloadEvents => Set<DownloadEvent>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Ensure all DateTime values are stored/read as UTC for PostgreSQL compatibility
        configurationBuilder.Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();
        configurationBuilder.Properties<DateTime?>()
            .HaveConversion<UtcNullableDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DropLinkInviteCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CodeHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(e => e.CodeHash).IsUnique();
            entity.Property(e => e.Label).HasMaxLength(100);
        });

        modelBuilder.Entity<Drop>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PublicId).HasMaxLength(30).IsRequired();
            entity.HasIndex(e => e.PublicId).IsUnique();
            entity.Property(e => e.OriginalFilename).HasMaxLength(500);
            entity.Property(e => e.ContentType).HasMaxLength(255);
            entity.Property(e => e.StoragePath).HasMaxLength(1000);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Ignore(e => e.S3UploadId);

            entity.HasOne(e => e.InviteCode)
                .WithMany(i => i.Drops)
                .HasForeignKey(e => e.InviteCodeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DownloadEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasOne(e => e.Drop)
                .WithMany(d => d.DownloadEvents)
                .HasForeignKey(e => e.DropId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
