import { Injectable, signal } from '@angular/core';
import { Tenant } from '../models/tenant.model';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  // Launch default tenant derived from Phase 0 seed data
  private readonly defaultTenant: Tenant = {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Swaad Foods (Delhi NCR)',
    slug: 'swaad-foods',
    settings: {
      enabledDeliveryModes: ['Pickup', 'InHouseDelivery'],
      enabledPaymentMethods: ['UpiIntent', 'UpiQr'],
      maxStaffAccounts: 1,
      gstRegistered: true
    }
  };

  private readonly secondaryTenant: Tenant = {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'Royal Biryani House (Mumbai)',
    slug: 'royal-biryani',
    settings: {
      enabledDeliveryModes: ['Pickup', 'InHouseDelivery', 'AggregatorDelivery'],
      enabledPaymentMethods: ['UpiIntent', 'Razorpay', 'PayU'],
      maxStaffAccounts: 3,
      gstRegistered: true
    }
  };

  readonly activeTenant = signal<Tenant>(this.defaultTenant);
  readonly availableTenants = [this.defaultTenant, this.secondaryTenant];

  setTenant(tenantId: string): void {
    const found = this.availableTenants.find(t => t.id === tenantId);
    if (found) {
      this.activeTenant.set(found);
    }
  }
}
