using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Services;

public class TestTenantContext : ITenantContext
{
    public Guid TenantId { get; private set; }

    public TestTenantContext(Guid tenantId)
    {
        TenantId = tenantId;
    }

    public void SetTenantId(Guid tenantId)
    {
        TenantId = tenantId;
    }
}
