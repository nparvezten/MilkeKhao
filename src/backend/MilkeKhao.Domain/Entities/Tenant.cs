namespace MilkeKhao.Domain.Entities;

/// <summary>
/// Tenant Aggregate Root representing a restaurant tenant in the multi-tenant platform.
/// </summary>
public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public TenantFeatureSettings Settings { get; set; } = new TenantFeatureSettings();
}
