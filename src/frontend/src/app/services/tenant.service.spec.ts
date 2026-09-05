import { TestBed } from '@angular/core/testing';
import { TenantService } from './tenant.service';
import { Tenant } from '../models/tenant.model';

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantService);
  });

  it('should initialize with default Swaad Foods tenant', () => {
    expect(service.activeTenant()).toBeTruthy();
    expect(service.activeTenant().slug).toBe('swaad-foods');
    expect(service.availableTenants().length).toBeGreaterThanOrEqual(2);
  });

  it('should switch active tenant by ID', () => {
    const secondaryTenant = service.availableTenants()[1];
    service.setTenant(secondaryTenant.id);

    expect(service.activeTenant().id).toBe(secondaryTenant.id);
    expect(service.activeTenant().slug).toBe(secondaryTenant.slug);
  });

  it('should dynamically register a new tenant and set as active', () => {
    const newTenant: Tenant = {
      id: 'tenant-test-3',
      name: 'Pind Balluchi (Chandigarh)',
      slug: 'pind-balluchi',
      settings: {
        enabledDeliveryModes: ['Pickup', 'InHouseDelivery'],
        enabledPaymentMethods: ['UpiIntent', 'UpiQr'],
        maxStaffAccounts: 2,
        gstRegistered: true
      }
    };

    const initialCount = service.availableTenants().length;
    service.addTenant(newTenant);

    expect(service.availableTenants().length).toBe(initialCount + 1);
    expect(service.activeTenant().id).toBe('tenant-test-3');
    expect(service.activeTenant().name).toContain('Pind Balluchi');
  });
});
