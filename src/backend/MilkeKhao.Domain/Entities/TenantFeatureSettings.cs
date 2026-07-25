namespace MilkeKhao.Domain.Entities;

/// <summary>
/// Owned entity on Tenant controlling feature toggles, enabled payment methods, delivery modes, and account limits.
/// Launch defaults are narrow and widened via configuration.
/// </summary>
public class TenantFeatureSettings
{
    public List<string> EnabledDeliveryModes { get; set; } = new List<string> { "Pickup", "AggregatorDelivery" };
    public List<string> EnabledPaymentMethods { get; set; } = new List<string> { "UpiIntent", "UpiQr" };
    public int MaxStaffAccounts { get; set; } = 1;
    public bool GstRegistered { get; set; } = false;
}
