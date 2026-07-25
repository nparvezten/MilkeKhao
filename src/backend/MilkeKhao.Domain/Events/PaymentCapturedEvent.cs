using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Domain.ValueObjects;

namespace MilkeKhao.Domain.Events;

public record PaymentCapturedEvent(
    Guid OrderId,
    Guid TenantId,
    Money Amount,
    PaymentMethod PaymentMethod,
    string TransactionId,
    DateTimeOffset OccurredOn
) : IDomainEvent
{
    public PaymentCapturedEvent(Guid orderId, Guid tenantId, Money amount, PaymentMethod paymentMethod, string transactionId)
        : this(orderId, tenantId, amount, paymentMethod, transactionId, DateTimeOffset.UtcNow) { }
}
