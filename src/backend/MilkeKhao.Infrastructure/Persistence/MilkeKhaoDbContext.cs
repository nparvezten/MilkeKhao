using System.Reflection;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Infrastructure.Persistence;

public class MilkeKhaoDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public DbSet<Tenant> Tenants => Set<Tenant>();

    public MilkeKhaoDbContext(DbContextOptions<MilkeKhaoDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Tenant Aggregate Root & Owned TenantFeatureSettings entity
        modelBuilder.Entity<Tenant>(builder =>
        {
            builder.HasKey(t => t.Id);
            builder.Property(t => t.Name).IsRequired().HasMaxLength(200);
            builder.Property(t => t.Slug).IsRequired().HasMaxLength(200);

            builder.OwnsOne(t => t.Settings, settingsBuilder =>
            {
                settingsBuilder.Property(s => s.EnabledDeliveryModes);
                settingsBuilder.Property(s => s.EnabledPaymentMethods);
                settingsBuilder.Property(s => s.MaxStaffAccounts);
                settingsBuilder.Property(s => s.GstRegistered);
            });
        });

        // Apply global query filter to all ITenantScoped entities automatically
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(MilkeKhaoDbContext)
                    .GetMethod(nameof(SetTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)!
                    .MakeGenericMethod(entityType.ClrType);
                method.Invoke(this, new object[] { modelBuilder });
            }
        }
    }

    private void SetTenantFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : class, ITenantScoped
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);
    }
}
