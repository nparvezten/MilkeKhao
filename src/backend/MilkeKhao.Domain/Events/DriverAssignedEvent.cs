using MilkeKhao.Domain.Common;

namespace MilkeKhao.Domain.Events;

public record DriverAssignedEvent(
    Guid OrderId,
    Guid DriverId,
    Guid TenantId,
    DateTimeOffset OccurredOn
) : IDomainEvent
{
    public DriverAssignedEvent(Guid orderId, Guid driverId, Guid tenantId)
        : this(orderId, driverId, tenantId, DateTimeOffset.UtcNow) { }
}
