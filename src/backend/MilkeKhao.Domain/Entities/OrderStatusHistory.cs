using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Domain.Entities;

public class OrderStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? PerformedByUserId { get; set; }
    public string? Notes { get; set; }
}
