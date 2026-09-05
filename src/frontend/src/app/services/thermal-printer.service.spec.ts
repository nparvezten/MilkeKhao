import { TestBed } from '@angular/core/testing';
import { ThermalPrinterService } from './thermal-printer.service';
import { Order, OrderStatus, DeliveryMode, PaymentMethod } from '../models/order.model';

describe('ThermalPrinterService', () => {
  let service: ThermalPrinterService;

  const mockOrder: Order = {
    id: 'ord-1234',
    tenantId: 'tenant-1',
    customerId: 'cust-1',
    status: OrderStatus.Pending,
    deliveryMode: DeliveryMode.Pickup,
    paymentMethod: PaymentMethod.UpiIntent,
    items: [
      {
        menuItemId: 'item-1',
        menuItemName: 'Chicken Biryani',
        unitPrice: 350,
        quantity: 2,
        subTotal: 700
      }
    ],
    totalAmount: 700,
    currency: 'INR',
    isPaid: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThermalPrinterService);
  });

  it('should generate valid binary ESC/POS buffer with ESC @ and GS ! commands', () => {
    const buffer = service.generateEscPosBuffer(mockOrder, 'Swaad Foods');

    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(20);

    // Assert ESC @ (0x1B, 0x40) printer initialization
    expect(buffer[0]).toBe(0x1B);
    expect(buffer[1]).toBe(0x40);

    // Assert Full Cut command at end (GS V 0x41 0x00)
    const len = buffer.length;
    expect(buffer[len - 4]).toBe(0x1D); // GS
    expect(buffer[len - 3]).toBe(0x56); // V
    expect(buffer[len - 2]).toBe(0x41); // 'A'
    expect(buffer[len - 1]).toBe(0x00); // 0
  });
});
