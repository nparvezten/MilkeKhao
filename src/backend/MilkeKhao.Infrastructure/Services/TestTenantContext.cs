using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Services;

/// <summary>
/// Stub implementation of ITenantContext for Phase 0 testing and initial local development.
/// Will be replaced with real HttpContext/JWT claim resolution in Phase 3.
/// </summary>
public class TestTenantContext : ITenantContext
{
    public Guid TenantId { get; set; } = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public TestTenantContext()
    {
    }

    public TestTenantContext(Guid tenantId)
    {
        TenantId = tenantId;
    }
}
