namespace MilkeKhao.Domain.Common;

/// <summary>
/// Interface implemented by all domain entities owned by a specific tenant.
/// Used to enforce automatic EF Core global query filters for multi-tenant data isolation.
/// </summary>
public interface ITenantScoped
{
    Guid TenantId { get; set; }
}
