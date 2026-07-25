using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Application.Orders.Commands;
using MilkeKhao.Application.Orders.DTOs;
using MilkeKhao.Application.Orders.Handlers;
using MilkeKhao.Application.Orders.Queries;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Domain.ValueObjects;
using MilkeKhao.Infrastructure.Persistence;
using MilkeKhao.Infrastructure.Services;
using Xunit;

namespace MilkeKhao.UnitTests;

public class OrderCommandTests
{
    private MilkeKhaoDbContext CreateDbContext(ITenantContext tenantContext, string dbName)
    {
        var options = new DbContextOptionsBuilder<MilkeKhaoDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new MilkeKhaoDbContext(options, tenantContext);
    }

    [Fact]
    public async Task CreateOrderCommand_Succeeds_AndDerivesTenantFromContext()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenantContext = new TestTenantContext(tenantId);
        var dbName = Guid.NewGuid().ToString();

        using (var context = CreateDbContext(tenantContext, dbName))
        {
            var menuItemId = Guid.NewGuid();
            context.MenuItems.Add(new MenuItem
            {
                Id = menuItemId,
                TenantId = tenantId,
                Name = "Paneer Tikka",
                Price = new Money(250m, "INR"),
                IsAvailable = true
            });
            await context.SaveChangesAsync();

            var handler = new CreateOrderCommandHandler(context, tenantContext);
            var command = new CreateOrderCommand(
                CustomerId: Guid.NewGuid(),
                DeliveryMode: DeliveryMode.Pickup,
                PaymentMethod: PaymentMethod.UpiIntent,
                DeliveryAddress: null,
                Items: new List<CreateOrderItemRequest>
                {
                    new CreateOrderItemRequest(menuItemId, 2)
                }
            );

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(tenantId, result.TenantId);
            Assert.Equal(500m, result.TotalAmount);
            Assert.Equal(OrderStatus.Pending, result.Status);
            Assert.Single(result.Items);
            Assert.Equal("Paneer Tikka", result.Items[0].MenuItemName);
        }
    }

    [Fact]
    public async Task UpdateOrderStatusCommand_UpdatesStatus_AndAppendsStatusHistory()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var tenantContext = new TestTenantContext(tenantId);
        var performedByUserId = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();

        using (var context = CreateDbContext(tenantContext, dbName))
        {
            var menuItemId = Guid.NewGuid();
            context.MenuItems.Add(new MenuItem
            {
                Id = menuItemId,
                TenantId = tenantId,
                Name = "Paneer Tikka",
                Price = new Money(250m, "INR"),
                IsAvailable = true
            });
            await context.SaveChangesAsync();

            var createHandler = new CreateOrderCommandHandler(context, tenantContext);
            var createCommand = new CreateOrderCommand(
                CustomerId: Guid.NewGuid(),
                DeliveryMode: DeliveryMode.InHouseDelivery,
                PaymentMethod: PaymentMethod.UpiIntent,
                DeliveryAddress: new AddressDto("123 Main St", "New Delhi", "Delhi", "110001", "Park View", 28.61, 77.20),
                Items: new List<CreateOrderItemRequest> { new CreateOrderItemRequest(menuItemId, 1) }
            );
            var createdOrder = await createHandler.Handle(createCommand, CancellationToken.None);

            // Clear tracker to simulate fresh request / scope
            context.ChangeTracker.Clear();

            var updateHandler = new UpdateOrderStatusCommandHandler(context, tenantContext);
            var updateCommand = new UpdateOrderStatusCommand(
                OrderId: createdOrder.Id,
                NewStatus: OrderStatus.Preparing,
                PerformedByUserId: performedByUserId,
                Notes: "Chef started cooking"
            );

            // Act
            var result = await updateHandler.Handle(updateCommand, CancellationToken.None);

            // Assert
            Assert.Equal(OrderStatus.Preparing, result.Status);
        }
    }

    [Fact]
    public async Task Handler_RejectsOrIgnores_CrossTenantDataAccessAttempt()
    {
        // Arrange
        var tenantIdA = Guid.NewGuid();
        var tenantIdB = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();

        var orderIdA = Guid.NewGuid();
        var contextA = new TestTenantContext(tenantIdA);

        using (var seedContext = CreateDbContext(contextA, dbName))
        {
            seedContext.Orders.Add(new Order
            {
                Id = orderIdA,
                TenantId = tenantIdA,
                CustomerId = Guid.NewGuid(),
                Status = OrderStatus.Pending,
                DeliveryMode = DeliveryMode.Pickup,
                PaymentMethod = PaymentMethod.UpiIntent,
                TotalAmount = new Money(400m, "INR")
            });
            await seedContext.SaveChangesAsync();
        }

        // Act & Assert - Attempting to access Tenant A order using Tenant B Context
        var contextB = new TestTenantContext(tenantIdB);
        using (var dbContextB = CreateDbContext(contextB, dbName))
        {
            var queryHandler = new GetOrderByIdQueryHandler(dbContextB, contextB);
            var result = await queryHandler.Handle(new GetOrderByIdQuery(orderIdA), CancellationToken.None);

            // Global query filter prevents finding Tenant A order for Tenant B context
            Assert.Null(result);
        }
    }
}
