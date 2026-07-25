using System.Reflection;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.ValueObjects;

namespace MilkeKhao.Infrastructure.Persistence;

public class MilkeKhaoDbContext : DbContext, IMilkeKhaoDbContext
{
    private readonly ITenantContext _tenantContext;

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();

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

        // Category Configuration
        modelBuilder.Entity<Category>(builder =>
        {
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
            builder.HasQueryFilter(c => !c.IsDeleted);
        });

        // MenuItem Configuration
        modelBuilder.Entity<MenuItem>(builder =>
        {
            builder.HasKey(m => m.Id);
            builder.Property(m => m.Name).IsRequired().HasMaxLength(150);
            builder.OwnsOne(m => m.Price, p =>
            {
                p.Property(x => x.Amount).HasPrecision(18, 2);
                p.Property(x => x.Currency).HasMaxLength(10);
            });
            builder.HasQueryFilter(m => !m.IsDeleted);
        });

        // User Configuration
        modelBuilder.Entity<User>(builder =>
        {
            builder.HasKey(u => u.Id);
            builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
            builder.Property(u => u.PhoneNumber).IsRequired().HasMaxLength(50);
            builder.HasQueryFilter(u => !u.IsDeleted);
        });

        // Driver Configuration
        modelBuilder.Entity<Driver>(builder =>
        {
            builder.HasKey(d => d.Id);
            builder.HasQueryFilter(d => !d.IsDeleted);
        });

        // OrderItem Entity Configuration
        modelBuilder.Entity<OrderItem>(builder =>
        {
            builder.HasKey(i => i.Id);
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.Currency).HasMaxLength(10);
        });

        // OrderStatusHistory Entity Configuration
        modelBuilder.Entity<OrderStatusHistory>(builder =>
        {
            builder.HasKey(s => s.Id);
        });

        // Order Aggregate Root Configuration
        modelBuilder.Entity<Order>(builder =>
        {
            builder.HasKey(o => o.Id);

            builder.OwnsOne(o => o.TotalAmount, ta =>
            {
                ta.Property(x => x.Amount).HasPrecision(18, 2);
                ta.Property(x => x.Currency).HasMaxLength(10);
            });

            builder.OwnsOne(o => o.DeliveryAddress, da =>
            {
                da.Property(a => a.Street).HasMaxLength(200);
                da.Property(a => a.City).HasMaxLength(100);
                da.Property(a => a.State).HasMaxLength(100);
                da.Property(a => a.PostalCode).HasMaxLength(20);
            });

            builder.HasMany(o => o.Items)
                   .WithOne()
                   .HasForeignKey(i => i.OrderId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(o => o.StatusHistory)
                   .WithOne()
                   .HasForeignKey(s => s.OrderId)
                   .OnDelete(DeleteBehavior.Cascade);

            if (Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
            {
                builder.Property(o => o.RowVersion).IsRowVersion();
            }

            builder.HasQueryFilter(o => !o.IsDeleted);
        });

        // Apply global query filter to all ITenantScoped root entities automatically (excluding owned types)
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantScoped).IsAssignableFrom(entityType.ClrType) && !entityType.IsOwned())
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
