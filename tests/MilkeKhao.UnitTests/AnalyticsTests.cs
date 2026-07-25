using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Analytics.Queries;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Domain.ValueObjects;
using MilkeKhao.Infrastructure.Persistence;
using MilkeKhao.Infrastructure.Services;
using Xunit;

namespace MilkeKhao.UnitTests;

public class AnalyticsTests
{
    [Fact]
    public async Task GetSalesSummaryQuery_CalculatesMetricsAccurately_ForTenant()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<MilkeKhaoDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var tenantContext = new TestTenantContext(tenantId);
        using var context = new MilkeKhaoDbContext(options, tenantContext);

        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CustomerId = Guid.NewGuid(),
            DeliveryMode = DeliveryMode.Pickup,
            PaymentMethod = PaymentMethod.UpiIntent,
            Status = OrderStatus.Delivered,
            TotalAmount = new Money(700, "INR")
        };

        context.Orders.Add(order1);
        await context.SaveChangesAsync();

        var handlers = new AnalyticsQueryHandlers(context, tenantContext);

        // Act
        var result = await handlers.Handle(new GetSalesSummaryQuery(), CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalOrders);
        Assert.Equal(1, result.CompletedOrders);
        Assert.Equal(700, result.TotalSales);
    }
}
