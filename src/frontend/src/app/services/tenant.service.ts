import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Tenant } from '../models/tenant.model';
import { API_BASE_URL } from '../constants/api.constants';

export interface RegisterTenantApiRequest {
  name: string;
  slug: string;
  vpa: string;
  enabledDeliveryModes: string[];
  enabledPaymentMethods: string[];
  gstRegistered: boolean;
  gstNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly defaultTenant: Tenant = {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Swaad Foods (Delhi NCR)',
    slug: 'swaad-foods',
    settings: {
      enabledDeliveryModes: ['Pickup', 'InHouseDelivery', 'AggregatorDelivery'],
      enabledPaymentMethods: ['UpiIntent', 'UpiQr', 'Razorpay', 'PayU'],
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
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadTenantsFromApi();
  }

  loadTenantsFromApi(): void {
    this.isLoading.set(true);
    this.http.get<any[]>(`${API_BASE_URL}/api/v1/tenants`).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const mapped: Tenant[] = data.map(item => ({
            id: item.id || item.Id,
            name: item.name || item.Name,
            slug: item.slug || item.Slug,
            settings: {
              enabledDeliveryModes: item.settings?.enabledDeliveryModes || item.settings?.EnabledDeliveryModes || ['Pickup', 'InHouseDelivery'],
              enabledPaymentMethods: item.settings?.enabledPaymentMethods || item.settings?.EnabledPaymentMethods || ['UpiIntent', 'UpiQr'],
              maxStaffAccounts: item.settings?.maxStaffAccounts || 1,
              gstRegistered: item.settings?.gstRegistered ?? true
            }
          }));
          this.availableTenants.update(current => {
            const currentExtra = current.filter(c => !mapped.some(m => m.id === c.id || m.slug === c.slug));
            return [...mapped, ...currentExtra];
          });

          // Restore saved tenant from local storage or set first
          const savedTenantId = typeof localStorage !== 'undefined' ? localStorage.getItem('milkekhao_active_tenant_id') : null;
          const found = this.availableTenants().find(t => t.id === savedTenantId);
          if (found) {
            this.activeTenant.set(found);
          } else {
            this.activeTenant.set(this.availableTenants()[0]);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.warn('[TenantService] Failed to load tenants from backend API, using defaults:', err.message);
        this.isLoading.set(false);
      }
    });
  }

  setTenant(tenantId: string): void {
    const found = this.availableTenants().find(t => t.id === tenantId);
    if (found) {
      this.activeTenant.set(found);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('milkekhao_active_tenant_id', tenantId);
        }
      } catch {}
    }
  }

  addTenant(newTenant: Tenant): void {
    this.availableTenants.update(list => [...list, newTenant]);
    this.activeTenant.set(newTenant);
  }

  async registerTenant(request: RegisterTenantApiRequest): Promise<Tenant> {
    this.isLoading.set(true);
    return new Promise((resolve) => {
      this.http.post<any>(`${API_BASE_URL}/api/v1/tenants/register`, request).subscribe({
        next: (res) => {
          const newTenant: Tenant = {
            id: res.tenantId || res.TenantId || `tenant-${Date.now()}`,
            name: res.name || res.Name || request.name,
            slug: res.slug || res.Slug || request.slug,
            settings: {
              enabledDeliveryModes: request.enabledDeliveryModes,
              enabledPaymentMethods: request.enabledPaymentMethods,
              maxStaffAccounts: 1,
              gstRegistered: request.gstRegistered
            }
          };

          this.addTenant(newTenant);
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('milkekhao_active_tenant_id', newTenant.id);
            }
          } catch {}

          this.isLoading.set(false);
          resolve(newTenant);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.warn('[TenantService] Registration API failed, adding to local state:', err.message);
          // Fallback registration in local state
          const fallbackTenant: Tenant = {
            id: `tenant-${Date.now()}`,
            name: request.name,
            slug: request.slug,
            settings: {
              enabledDeliveryModes: request.enabledDeliveryModes,
              enabledPaymentMethods: request.enabledPaymentMethods,
              maxStaffAccounts: 1,
              gstRegistered: request.gstRegistered
            }
          };
          this.addTenant(fallbackTenant);
          resolve(fallbackTenant);
        }
      });
    });
  }
}
