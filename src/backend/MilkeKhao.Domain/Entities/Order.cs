using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Domain.ValueObjects;

namespace MilkeKhao.Domain.Entities;

public class Order : ITenantScoped, ISoftDelete
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? DriverId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public DeliveryMode DeliveryMode { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public Address DeliveryAddress { get; set; } = Address.Empty;
    public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    public Money TotalAmount { get; set; } = Money.Zero;
    public bool IsPaid { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public uint RowVersion { get; set; } = 1;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();

    private readonly List<IDomainEvent> _domainEvents = new List<IDomainEvent>();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}
