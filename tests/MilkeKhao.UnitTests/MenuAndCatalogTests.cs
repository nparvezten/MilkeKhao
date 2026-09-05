using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Application.Menu.Commands;
using MilkeKhao.Application.Menu.Handlers;
using MilkeKhao.Application.Menu.Queries;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.ValueObjects;
using MilkeKhao.Infrastructure.Persistence;
using Xunit;

namespace MilkeKhao.UnitTests;

public class MenuAndCatalogTests
{
    private (MilkeKhaoDbContext dbContext, Guid tenantId) CreateInMemoryContext(Guid? specifiedTenantId = null)
    {
        var tenantId = specifiedTenantId ?? Guid.NewGuid();
        var tenantContext = new StubTenantContext { TenantId = tenantId };
        var options = new DbContextOptionsBuilder<MilkeKhaoDbContext>()
            .UseInMemoryDatabase(databaseName: $"MilkeKhao_Menu_{Guid.NewGuid():N}")
            .Options;

        var context = new MilkeKhaoDbContext(options, tenantContext);
        return (context, tenantId);
    }

    [Fact]
    public async Task GetActiveMenuQuery_Returns_Only_Available_Items_For_Current_Tenant()
    {
        var (context, tenantId) = CreateInMemoryContext();
        var tenantContext = new StubTenantContext { TenantId = tenantId };
        var categoryId = Guid.NewGuid();

        // Add 1 available item, 1 unavailable item for tenant
        context.MenuItems.AddRange(
            new MenuItem
            {
                TenantId = tenantId,
                CategoryId = categoryId,
                Name = "Dal Makhani",
                Description = "Slow cooked black lentils",
                Price = new Money(220m, "INR"),
                IsAvailable = true
            },
            new MenuItem
            {
                TenantId = tenantId,
                CategoryId = categoryId,
                Name = "Seasonal Mango Lassi",
                Description = "Fresh mango yogurt drink",
                Price = new Money(90m, "INR"),
                IsAvailable = false // Unavailable
            }
        );
        await context.SaveChangesAsync();

        var handler = new MenuQueryHandler(context, tenantContext);

        // Act
        var result = await handler.Handle(new GetActiveMenuQuery(), CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal("Dal Makhani", result[0].Name);
        Assert.True(result[0].IsAvailable);
    }

    [Fact]
    public async Task CreateMenuItemCommand_Persists_Item_With_TenantId()
    {
        var (context, tenantId) = CreateInMemoryContext();
        var tenantContext = new StubTenantContext { TenantId = tenantId };
        var categoryId = Guid.NewGuid();

        var handler = new CreateMenuItemCommandHandler(context, tenantContext);
        var command = new CreateMenuItemCommand(
            CategoryId: categoryId,
            Name: "Kadhai Paneer",
            Description: "Cottage cheese with bell peppers and fresh ground spices",
            Price: 310m,
            ImageUrl: "https://images.unsplash.com/paneer.jpg"
        );

        // Act
        var created = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(created);
        Assert.Equal("Kadhai Paneer", created.Name);
        Assert.Equal(310m, created.Price);
        Assert.Equal(tenantId, created.TenantId);

        var dbItem = await context.MenuItems.FirstOrDefaultAsync(m => m.Id == created.Id);
        Assert.NotNull(dbItem);
        Assert.Equal("Kadhai Paneer", dbItem.Name);
    }

    [Fact]
    public async Task ToggleMenuItemAvailability_Flips_Availability_Status()
    {
        var (context, tenantId) = CreateInMemoryContext();
        var tenantContext = new StubTenantContext { TenantId = tenantId };
        var itemId = Guid.NewGuid();

        var item = new MenuItem
        {
            Id = itemId,
            TenantId = tenantId,
            CategoryId = Guid.NewGuid(),
            Name = "Garlic Naan",
            Price = new Money(60m, "INR"),
            IsAvailable = true
        };
        context.MenuItems.Add(item);
        await context.SaveChangesAsync();

        var handler = new ToggleMenuItemAvailabilityCommandHandler(context, tenantContext);

        // Act 1: Toggle from true -> false
        var status1 = await handler.Handle(new ToggleMenuItemAvailabilityCommand(itemId), CancellationToken.None);
        Assert.False(status1);

        // Act 2: Toggle from false -> true
        var status2 = await handler.Handle(new ToggleMenuItemAvailabilityCommand(itemId), CancellationToken.None);
        Assert.True(status2);
    }
}
