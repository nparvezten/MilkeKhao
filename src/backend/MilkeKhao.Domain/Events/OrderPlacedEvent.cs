using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Domain.Events;

public record OrderPlacedEvent(Order Order, DateTimeOffset OccurredOn) : IDomainEvent
{
    public OrderPlacedEvent(Order order) : this(order, DateTimeOffset.UtcNow) { }
}
