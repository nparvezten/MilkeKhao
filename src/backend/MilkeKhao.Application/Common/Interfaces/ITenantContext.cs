namespace MilkeKhao.Application.Common.Interfaces;

/// <summary>
/// Service interface for accessing current tenant context resolved from authentication context / JWT claims.
/// Injected into handlers and DbContext to enforce multi-tenant query isolation.
/// </summary>
public interface ITenantContext
{
    Guid TenantId { get; }
}
