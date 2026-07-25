using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Application.Orders.DTOs;

public record OrderItemDto(
    Guid MenuItemId,
    string MenuItemName,
    decimal UnitPrice,
    int Quantity,
    decimal SubTotal
);

public record AddressDto(
    string Street,
    string City,
    string State,
    string PostalCode,
    string? Landmark,
    double? Latitude,
    double? Longitude
);

public record OrderDto(
    Guid Id,
    Guid TenantId,
    Guid CustomerId,
    Guid? DriverId,
    OrderStatus Status,
    DeliveryMode DeliveryMode,
    PaymentMethod PaymentMethod,
    AddressDto? DeliveryAddress,
    List<OrderItemDto> Items,
    decimal TotalAmount,
    string Currency,
    bool IsPaid,
    DateTimeOffset CreatedAt
);
