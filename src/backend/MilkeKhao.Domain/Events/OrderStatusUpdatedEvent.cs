using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Domain.Events;

public record OrderStatusUpdatedEvent(
    Guid OrderId,
    Guid TenantId,
    OrderStatus PreviousStatus,
    OrderStatus NewStatus,
    Guid? PerformedByUserId,
    DateTimeOffset OccurredOn
) : IDomainEvent
{
    public OrderStatusUpdatedEvent(Guid orderId, Guid tenantId, OrderStatus previousStatus, OrderStatus newStatus, Guid? performedByUserId = null)
        : this(orderId, tenantId, previousStatus, newStatus, performedByUserId, DateTimeOffset.UtcNow) { }
}
