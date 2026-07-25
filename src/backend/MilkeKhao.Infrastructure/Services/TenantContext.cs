using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Services;

public class TenantContext : ITenantContext
{
    private Guid? _tenantId;

    public Guid TenantId
    {
        get => _tenantId ?? Guid.Parse("99999999-9999-9999-9999-999999999999");
        private set => _tenantId = value;
    }

    public void SetTenantId(Guid tenantId)
    {
        _tenantId = tenantId;
    }
}
