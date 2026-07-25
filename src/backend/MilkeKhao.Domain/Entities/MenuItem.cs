using MilkeKhao.Domain.Common;
using MilkeKhao.Domain.ValueObjects;

namespace MilkeKhao.Domain.Entities;

public class MenuItem : ITenantScoped, ISoftDelete
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Money Price { get; set; } = Money.Zero;
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
}
