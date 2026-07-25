using MilkeKhao.Domain.Common;

namespace MilkeKhao.Domain.Entities;

public class Driver : ITenantScoped, ISoftDelete
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string VehicleDetails { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
}
