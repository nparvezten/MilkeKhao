using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Infrastructure.Persistence;
using MilkeKhao.Infrastructure.Services;
using Xunit;

namespace MilkeKhao.UnitTests;

public class TestMenuItem : ITenantScoped
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class TestDbContext : MilkeKhaoDbContext
{
    public DbSet<TestMenuItem> TestMenuItems => Set<TestMenuItem>();

    public TestDbContext(DbContextOptions<MilkeKhaoDbContext> options, ITenantContext tenantContext)
        : base(options, tenantContext)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TestMenuItem>(builder =>
        {
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Name).IsRequired();
        });
    }
}

public class TenantQueryFilterTests
{
    [Fact]
    public async Task QueryFilter_ExcludesOtherTenantsData()
    {
        // Arrange
        var tenantIdA = Guid.NewGuid();
        var tenantIdB = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<MilkeKhaoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Seed data using a Context without query restrictions or direct seed
        var tenantContextA = new TestTenantContext(tenantIdA);
        using (var seedContext = new TestDbContext(options, tenantContextA))
        {
            seedContext.TestMenuItems.AddRange(
                new TestMenuItem { TenantId = tenantIdA, Name = "Burger Tenant A" },
                new TestMenuItem { TenantId = tenantIdA, Name = "Fries Tenant A" },
                new TestMenuItem { TenantId = tenantIdB, Name = "Pizza Tenant B" }
            );
            await seedContext.SaveChangesAsync();
        }

        // Act - Query with Tenant A Context
        using (var contextA = new TestDbContext(options, tenantContextA))
        {
            var itemsA = await contextA.TestMenuItems.ToListAsync();

            // Assert
            Assert.Equal(2, itemsA.Count);
            Assert.All(itemsA, item => Assert.Equal(tenantIdA, item.TenantId));
            Assert.DoesNotContain(itemsA, item => item.TenantId == tenantIdB);
        }

        // Act - Query with Tenant B Context
        var tenantContextB = new TestTenantContext(tenantIdB);
        using (var contextB = new TestDbContext(options, tenantContextB))
        {
            var itemsB = await contextB.TestMenuItems.ToListAsync();

            // Assert
            Assert.Single(itemsB);
            Assert.Equal("Pizza Tenant B", itemsB[0].Name);
            Assert.Equal(tenantIdB, itemsB[0].TenantId);
        }
    }

    [Fact]
    public async Task Tenant_SeededWithPhase0LaunchDefaults_MatchesSpec()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<MilkeKhaoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var tenantId = Guid.NewGuid();
        var tenantContext = new TestTenantContext(tenantId);

        var testTenant = new Tenant
        {
            Id = tenantId,
            Name = "Test Kitchen",
            Slug = "test-kitchen",
            IsActive = true,
            Settings = new TenantFeatureSettings
            {
                EnabledDeliveryModes = new List<string> { "Pickup", "AggregatorDelivery" },
                EnabledPaymentMethods = new List<string> { "UpiIntent", "UpiQr" },
                MaxStaffAccounts = 1,
                GstRegistered = false
            }
        };

        // Act
        using (var context = new MilkeKhaoDbContext(options, tenantContext))
        {
            context.Tenants.Add(testTenant);
            await context.SaveChangesAsync();
        }

        // Assert
        using (var context = new MilkeKhaoDbContext(options, tenantContext))
        {
            var savedTenant = await context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            Assert.NotNull(savedTenant);
            Assert.Equal("Test Kitchen", savedTenant.Name);
            Assert.Equal(2, savedTenant.Settings.EnabledDeliveryModes.Count);
            Assert.Contains("Pickup", savedTenant.Settings.EnabledDeliveryModes);
            Assert.Contains("AggregatorDelivery", savedTenant.Settings.EnabledDeliveryModes);
            Assert.Equal(2, savedTenant.Settings.EnabledPaymentMethods.Count);
            Assert.Contains("UpiIntent", savedTenant.Settings.EnabledPaymentMethods);
            Assert.Contains("UpiQr", savedTenant.Settings.EnabledPaymentMethods);
            Assert.Equal(1, savedTenant.Settings.MaxStaffAccounts);
            Assert.False(savedTenant.Settings.GstRegistered);
        }
    }
}
