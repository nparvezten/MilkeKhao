export interface TenantFeatureSettings {
  enabledDeliveryModes: string[];
  enabledPaymentMethods: string[];
  maxStaffAccounts: number;
  gstRegistered: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantFeatureSettings;
}
