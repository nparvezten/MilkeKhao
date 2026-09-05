using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Application.Coupons;
using MilkeKhao.Application.Tenants;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Infrastructure.Persistence;
using Xunit;

namespace MilkeKhao.UnitTests;

public class StubTenantContext : ITenantContext
{
    public Guid TenantId { get; set; } = Guid.NewGuid();
    public void SetTenantId(Guid tenantId) => TenantId = tenantId;
}

public class CouponAndOnboardingTests
{
    private (MilkeKhaoDbContext dbContext, Guid tenantId) CreateInMemoryContext()
    {
        var tenantContext = new StubTenantContext();
        var options = new DbContextOptionsBuilder<MilkeKhaoDbContext>()
            .UseInMemoryDatabase(databaseName: $"MilkeKhao_Coupons_{Guid.NewGuid():N}")
            .Options;

        var context = new MilkeKhaoDbContext(options, tenantContext);
        return (context, tenantContext.TenantId);
    }

    [Fact]
    public async Task ValidateCoupon_Applies_Builtin_FIRST50_With_Max_Discount_Cap()
    {
        var (context, tenantId) = CreateInMemoryContext();
        var tenantContext = new StubTenantContext { TenantId = tenantId };
        var handler = new ValidateCouponQueryHandler(context, tenantContext);

        // Act
        var result = await handler.Handle(new ValidateCouponQuery("FIRST50", 300.00m), CancellationToken.None);

        // Assert: 50% of 300 is 150, but capped at 100
        Assert.True(result.IsValid);
        Assert.Equal(100.00m, result.DiscountAmount);
        Assert.Equal(200.00m, result.FinalTotal);
    }

    [Fact]
    public async Task ValidateCoupon_Enforces_Minimum_Order_For_FLAT100()
    {
        var (context, tenantId) = CreateInMemoryContext();
        var tenantContext = new StubTenantContext { TenantId = tenantId };
        var handler = new ValidateCouponQueryHandler(context, tenantContext);

        // Act with below min order amount (250 < 399)
        var result = await handler.Handle(new ValidateCouponQuery("FLAT100", 250.00m), CancellationToken.None);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal(0, result.DiscountAmount);
    }

    [Fact]
    public async Task RegisterTenant_Successfully_Creates_Tenant_And_Seeds_Menu()
    {
        var (context, _) = CreateInMemoryContext();
        var handler = new RegisterTenantCommandHandler(context);

        var command = new RegisterTenantCommand(
            Name: "Royal Awadhi Kitchen",
            Slug: "royal-awadhi",
            Vpa: "royal.awadhi@upi",
            EnabledDeliveryModes: new List<string> { "Pickup", "InHouseDelivery" },
            EnabledPaymentMethods: new List<string> { "UpiIntent", "UpiQr" },
            GstRegistered: true
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("royal-awadhi", result.Slug);

        var savedTenant = await context.Tenants.FirstOrDefaultAsync(t => t.Id == result.TenantId);
        Assert.NotNull(savedTenant);
        Assert.Equal("Royal Awadhi Kitchen", savedTenant.Name);

        var seededMenuItems = await context.MenuItems.IgnoreQueryFilters().Where(m => m.TenantId == result.TenantId).ToListAsync();
        Assert.Equal(2, seededMenuItems.Count);
    }
}
