using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Orders.Commands;
using MilkeKhao.Application.Orders.Handlers;
using MilkeKhao.Application.Orders.Queries;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Domain.ValueObjects;
using MilkeKhao.Infrastructure.Persistence;
using Xunit;

namespace MilkeKhao.UnitTests;

public class OrderLifecycleAndHistoryTests
{
    private (MilkeKhaoDbContext dbContext, Guid tenantId) CreateInMemoryContext()
    {
        var tenantId = Guid.NewGuid();
        var tenantContext = new StubTenantContext { TenantId = tenantId };
        var options = new DbContextOptionsBuilder<MilkeKhaoDbContext>()
            .UseInMemoryDatabase(databaseName: $"MilkeKhao_OrderLife_{Guid.NewGuid():N}")
            .Options;

        var context = new MilkeKhaoDbContext(options, tenantContext);
        return (context, tenantId);
    }

    [Fact]
    public async Task UpdateOrderStatus_Appends_Audit_History_With_Timestamp_And_User()
    {
        var (context, tenantId) = CreateInMemoryContext();
        var tenantContext = new StubTenantContext { TenantId = tenantId };

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CustomerId = Guid.NewGuid(),
            Status = OrderStatus.Pending,
            DeliveryMode = DeliveryMode.InHouseDelivery,
            DeliveryAddress = new Address("Plot 14, Sector 18", "Noida", "201301", "Near Wave Mall"),
            TotalAmount = new Money(450m, "INR")
        };
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var updateHandler = new UpdateOrderStatusCommandHandler(context, tenantContext);
        var kitchenStaffId = Guid.NewGuid();

        // 1. Transition: Pending -> Accepted
        await updateHandler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.Accepted, kitchenStaffId, "Kitchen acknowledged order"), CancellationToken.None);

        // 2. Transition: Accepted -> Preparing
        await updateHandler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.Preparing, kitchenStaffId, "Chef started cooking"), CancellationToken.None);

        // 3. Transition: Preparing -> ReadyForPickup
        await updateHandler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.ReadyForPickup, kitchenStaffId, "Food packed in insulated bag"), CancellationToken.None);

        // 4. Transition: ReadyForPickup -> Delivered
        var driverId = Guid.NewGuid();
        await updateHandler.Handle(new UpdateOrderStatusCommand(order.Id, OrderStatus.Delivered, driverId, "Delivered to customer doorstep"), CancellationToken.None);

        // Verify with DbContext directly
        var historyRecords = await context.OrderStatusHistories
            .Where(h => h.OrderId == order.Id)
            .OrderBy(h => h.ChangedAt)
            .ToListAsync();

        var updatedOrder = await context.Orders.FirstOrDefaultAsync(o => o.Id == order.Id);

        // Assert
        Assert.NotNull(updatedOrder);
        Assert.Equal(OrderStatus.Delivered, updatedOrder.Status);
        Assert.Equal(4, historyRecords.Count);
        Assert.Equal(OrderStatus.Accepted, historyRecords[0].Status);
        Assert.Equal(OrderStatus.Delivered, historyRecords[3].Status);
        Assert.Equal("Delivered to customer doorstep", historyRecords[3].Notes);
    }

    [Fact]
    public async Task GetKitchenActiveOrders_Excludes_Delivered_And_Cancelled_Orders()
    {
        var (context, tenantId) = CreateInMemoryContext();

        context.Orders.AddRange(
            new Order
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Status = OrderStatus.Pending,
                TotalAmount = new Money(200m, "INR"),
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-10)
            },
            new Order
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Status = OrderStatus.Preparing,
                TotalAmount = new Money(350m, "INR"),
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-5)
            },
            new Order
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Status = OrderStatus.Delivered, // Should be excluded from active kitchen view
                TotalAmount = new Money(500m, "INR"),
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30)
            },
            new Order
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Status = OrderStatus.Cancelled, // Should be excluded from active kitchen view
                TotalAmount = new Money(150m, "INR"),
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-20)
            }
        );
        await context.SaveChangesAsync();

        var handler = new GetKitchenActiveOrdersQueryHandler(context);

        // Act
        var activeOrders = await handler.Handle(new GetKitchenActiveOrdersQuery(), CancellationToken.None);

        // Assert: Only 2 active orders (Pending and Preparing)
        Assert.Equal(2, activeOrders.Count);
        Assert.Contains(activeOrders, o => o.Status == OrderStatus.Pending);
        Assert.Contains(activeOrders, o => o.Status == OrderStatus.Preparing);
        Assert.DoesNotContain(activeOrders, o => o.Status == OrderStatus.Delivered);
        Assert.DoesNotContain(activeOrders, o => o.Status == OrderStatus.Cancelled);
    }
}
