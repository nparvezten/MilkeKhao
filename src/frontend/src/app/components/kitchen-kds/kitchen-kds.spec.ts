import { TestBed } from '@angular/core/testing';
import { KitchenKdsComponent } from './kitchen-kds';
import { OrderService } from '../../services/order.service';
import { TenantService } from '../../services/tenant.service';
import { AudioAlertService } from '../../services/audio-alert.service';
import { ThermalPrinterService } from '../../services/thermal-printer.service';
import { OrderStatus } from '../../models/order.model';

describe('KitchenKdsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenKdsComponent],
      providers: [OrderService, TenantService, AudioAlertService, ThermalPrinterService]
    }).compileComponents();
  });

  it('should create the KDS component', () => {
    const fixture = TestBed.createComponent(KitchenKdsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should categorize initial seeded orders into appropriate pipeline buckets', () => {
    const fixture = TestBed.createComponent(KitchenKdsComponent);
    const component = fixture.componentInstance;

    expect(component.pendingOrders().length).toBeGreaterThanOrEqual(1);
    expect(component.acceptedOrders().length).toBeGreaterThanOrEqual(1);
    expect(component.preparingOrders().length).toBeGreaterThanOrEqual(1);
    expect(component.readyOrders().length).toBeGreaterThanOrEqual(1);
  });

  it('should update order status when kitchen staff accepts an order', () => {
    const fixture = TestBed.createComponent(KitchenKdsComponent);
    const component = fixture.componentInstance;
    const orderService = TestBed.inject(OrderService);

    const pendingOrder = component.pendingOrders()[0];
    if (pendingOrder) {
      const orderId = pendingOrder.id;
      orderService.updateOrderStatus(orderId, OrderStatus.Accepted);

      expect(component.pendingOrders().some(o => o.id === orderId)).toBe(false);
      expect(component.acceptedOrders().some(o => o.id === orderId)).toBe(true);
    }
  });
});
