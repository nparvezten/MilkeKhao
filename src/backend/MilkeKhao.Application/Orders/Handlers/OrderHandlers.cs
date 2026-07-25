using Mediator;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Application.Orders.Commands;
using MilkeKhao.Application.Orders.DTOs;
using MilkeKhao.Application.Orders.Queries;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Domain.Events;
using MilkeKhao.Domain.ValueObjects;

namespace MilkeKhao.Application.Orders.Handlers;

public class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand, OrderDto>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;

    public CreateOrderCommandHandler(IMilkeKhaoDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async ValueTask<OrderDto> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;

        var menuItemIds = command.Items.Select(i => i.MenuItemId).ToList();
        var menuItems = await _context.MenuItems
            .Where(m => menuItemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, cancellationToken);

        var orderItems = new List<OrderItem>();
        decimal totalAmount = 0m;

        foreach (var itemReq in command.Items)
        {
            if (!menuItems.TryGetValue(itemReq.MenuItemId, out var menuItem))
            {
                throw new InvalidOperationException($"MenuItem with ID {itemReq.MenuItemId} was not found.");
            }

            var orderItem = new OrderItem(
                menuItem.Id,
                menuItem.Name,
                menuItem.Price,
                itemReq.Quantity
            );

            orderItems.Add(orderItem);
            totalAmount += orderItem.SubTotal.Amount;
        }

        Address address = Address.Empty;
        if (command.DeliveryAddress != null)
        {
            address = new Address(
                command.DeliveryAddress.Street,
                command.DeliveryAddress.City,
                command.DeliveryAddress.State,
                command.DeliveryAddress.PostalCode,
                command.DeliveryAddress.Landmark,
                command.DeliveryAddress.Latitude,
                command.DeliveryAddress.Longitude
            );
        }

        var order = new Order
        {
            TenantId = tenantId,
            CustomerId = command.CustomerId,
            Status = OrderStatus.Pending,
            DeliveryMode = command.DeliveryMode,
            PaymentMethod = command.PaymentMethod,
            DeliveryAddress = address,
            Items = orderItems,
            TotalAmount = new Money(totalAmount, "INR"),
            IsPaid = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var initialHistory = new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = OrderStatus.Pending,
            ChangedAt = DateTimeOffset.UtcNow,
            Notes = "Order placed by customer."
        };

        order.AddDomainEvent(new OrderPlacedEvent(order));

        _context.Orders.Add(order);
        _context.OrderStatusHistories.Add(initialHistory);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(order);
    }

    public static OrderDto MapToDto(Order order)
    {
        return new OrderDto(
            order.Id,
            order.TenantId,
            order.CustomerId,
            order.DriverId,
            order.Status,
            order.DeliveryMode,
            order.PaymentMethod,
            order.DeliveryAddress != null && !string.IsNullOrEmpty(order.DeliveryAddress.Street)
                ? new AddressDto(
                    order.DeliveryAddress.Street,
                    order.DeliveryAddress.City,
                    order.DeliveryAddress.State,
                    order.DeliveryAddress.PostalCode,
                    order.DeliveryAddress.Landmark,
                    order.DeliveryAddress.Latitude,
                    order.DeliveryAddress.Longitude
                )
                : null,
            order.Items != null
                ? order.Items.Select(i => new OrderItemDto(
                    i.MenuItemId,
                    i.MenuItemName,
                    i.UnitPrice,
                    i.Quantity,
                    i.SubTotal.Amount
                )).ToList()
                : new List<OrderItemDto>(),
            order.TotalAmount.Amount,
            order.TotalAmount.Currency,
            order.IsPaid,
            order.CreatedAt
        );
    }
}

public class UpdateOrderStatusCommandHandler : ICommandHandler<UpdateOrderStatusCommand, OrderDto>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;

    public UpdateOrderStatusCommandHandler(IMilkeKhaoDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async ValueTask<OrderDto> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == command.OrderId, cancellationToken);

        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {command.OrderId} was not found or access denied.");
        }

        if (order.TenantId != tenantId)
        {
            throw new UnauthorizedAccessException("Cross-tenant data access strictly prohibited.");
        }

        var oldStatus = order.Status;
        order.Status = command.NewStatus;

        var historyEntry = new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            Status = command.NewStatus,
            ChangedAt = DateTimeOffset.UtcNow,
            PerformedByUserId = command.PerformedByUserId,
            Notes = command.Notes
        };

        _context.OrderStatusHistories.Add(historyEntry);

        order.AddDomainEvent(new OrderStatusUpdatedEvent(
            order.Id,
            order.TenantId,
            oldStatus,
            command.NewStatus,
            command.PerformedByUserId
        ));

        await _context.SaveChangesAsync(cancellationToken);

        return CreateOrderCommandHandler.MapToDto(order);
    }
}

public class GetOrderByIdQueryHandler : IQueryHandler<GetOrderByIdQuery, OrderDto?>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;

    public GetOrderByIdQueryHandler(IMilkeKhaoDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async ValueTask<OrderDto?> Handle(GetOrderByIdQuery query, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;

        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == query.OrderId, cancellationToken);

        if (order == null || order.TenantId != tenantId)
            return null;

        return CreateOrderCommandHandler.MapToDto(order);
    }
}

public class GetKitchenActiveOrdersQueryHandler : IQueryHandler<GetKitchenActiveOrdersQuery, List<OrderDto>>
{
    private readonly IMilkeKhaoDbContext _context;

    public GetKitchenActiveOrdersQueryHandler(IMilkeKhaoDbContext context)
    {
        _context = context;
    }

    public async ValueTask<List<OrderDto>> Handle(GetKitchenActiveOrdersQuery query, CancellationToken cancellationToken)
    {
        var activeStatuses = new[]
        {
            OrderStatus.Pending,
            OrderStatus.Accepted,
            OrderStatus.Preparing,
            OrderStatus.ReadyForPickup
        };

        var orders = await _context.Orders
            .Include(o => o.Items)
            .Where(o => activeStatuses.Contains(o.Status))
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(CreateOrderCommandHandler.MapToDto).ToList();
    }
}
