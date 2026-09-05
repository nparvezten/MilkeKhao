import { Injectable, signal } from '@angular/core';
import { Tenant } from '../models/tenant.model';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
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

  readonly availableTenants = signal<Tenant[]>([this.defaultTenant, this.secondaryTenant]);
  readonly activeTenant = signal<Tenant>(this.defaultTenant);

  setTenant(tenantId: string): void {
    const found = this.availableTenants().find(t => t.id === tenantId);
    if (found) {
      this.activeTenant.set(found);
    }
  }

  addTenant(newTenant: Tenant): void {
    this.availableTenants.update(list => [...list, newTenant]);
    this.activeTenant.set(newTenant);
  }
}
