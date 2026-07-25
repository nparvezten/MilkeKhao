using MilkeKhao.Domain.Common;

namespace MilkeKhao.Domain.Events;

public record PaymentFailedEvent(
    Guid OrderId,
    Guid TenantId,
    string Reason,
    DateTimeOffset OccurredOn
) : IDomainEvent
{
    public PaymentFailedEvent(Guid orderId, Guid tenantId, string reason)
        : this(orderId, tenantId, reason, DateTimeOffset.UtcNow) { }
}
