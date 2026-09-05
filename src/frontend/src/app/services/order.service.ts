import { Injectable, signal } from '@angular/core';
import { Order, OrderStatus, CreateOrderCommand, DeliveryMode, PaymentMethod } from '../models/order.model';
import { TenantService } from './tenant.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  readonly orders = signal<Order[]>([]);
  readonly isSubmitting = signal<boolean>(false);

  constructor(private tenantService: TenantService) {
    this.seedInitialActiveOrders();
  }

  private seedInitialActiveOrders(): void {
    const tenantId = this.tenantService.activeTenant().id;
    const initialOrders: Order[] = [
      {
        id: 'ord-101',
        tenantId,
        customerId: 'cust-501',
        status: OrderStatus.Pending,
        deliveryMode: DeliveryMode.InHouseDelivery,
        paymentMethod: PaymentMethod.UpiIntent,
        deliveryAddress: {
          street: 'B-12, Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          landmark: 'Near Metro Gate 3'
        },
        items: [
          { menuItemId: 'm-1', menuItemName: 'Butter Chicken (Half)', unitPrice: 380, quantity: 1, subTotal: 380 },
          { menuItemId: 'm-2', menuItemName: 'Garlic Naan', unitPrice: 60, quantity: 2, subTotal: 120 }
        ],
        totalAmount: 500,
        currency: 'INR',
        isPaid: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() // 12 mins ago
      },
      {
        id: 'ord-102',
        tenantId,
        customerId: 'cust-502',
        status: OrderStatus.Accepted,
        deliveryMode: DeliveryMode.Pickup,
        paymentMethod: PaymentMethod.UpiQr,
        items: [
          { menuItemId: 'm-3', menuItemName: 'Paneer Butter Masala', unitPrice: 320, quantity: 1, subTotal: 320 },
          { menuItemId: 'm-4', menuItemName: 'Jeera Rice', unitPrice: 150, quantity: 1, subTotal: 150 }
        ],
        totalAmount: 470,
        currency: 'INR',
        isPaid: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() // 20 mins ago
      },
      {
        id: 'ord-103',
        tenantId,
        customerId: 'cust-503',
        status: OrderStatus.Preparing,
        deliveryMode: DeliveryMode.InHouseDelivery,
        paymentMethod: PaymentMethod.UpiIntent,
        deliveryAddress: {
          street: 'A-45, Green Park Main',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110016'
        },
        items: [
          { menuItemId: 'm-5', menuItemName: 'Dal Makhani', unitPrice: 280, quantity: 1, subTotal: 280 },
          { menuItemId: 'm-6', menuItemName: 'Butter Tandoori Roti', unitPrice: 30, quantity: 4, subTotal: 120 }
        ],
        totalAmount: 400,
        currency: 'INR',
        isPaid: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString() // 28 mins ago
      },
      {
        id: 'ord-104',
        tenantId,
        customerId: 'cust-504',
        status: OrderStatus.ReadyForPickup,
        deliveryMode: DeliveryMode.Pickup,
        paymentMethod: PaymentMethod.UpiIntent,
        items: [
          { menuItemId: 'm-7', menuItemName: 'Murg Dum Biryani', unitPrice: 350, quantity: 1, subTotal: 350 }
        ],
        totalAmount: 350,
        currency: 'INR',
        isPaid: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString() // 35 mins ago
      }
    ];

    this.orders.set(initialOrders);
  }

  placeOrder(command: CreateOrderCommand): Promise<Order> {
    this.isSubmitting.set(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const tenantId = this.tenantService.activeTenant().id;
        const newOrder: Order = {
          id: `ord-${Math.floor(100 + Math.random() * 900)}`,
          tenantId,
          customerId: command.customerId,
          status: OrderStatus.Pending,
          deliveryMode: command.deliveryMode,
          paymentMethod: command.paymentMethod,
          deliveryAddress: command.deliveryAddress,
          items: command.items.map(i => ({
            menuItemId: i.menuItemId,
            menuItemName: `Item #${i.menuItemId}`,
            unitPrice: 250,
            quantity: i.quantity,
            subTotal: 250 * i.quantity
          })),
          totalAmount: command.items.reduce((sum, i) => sum + (250 * i.quantity), 0),
          currency: 'INR',
          isPaid: true,
          createdAt: new Date().toISOString()
        };

        this.orders.update(current => [newOrder, ...current]);
        this.isSubmitting.set(false);
        resolve(newOrder);
      }, 600);
    });
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    this.orders.update(current =>
      current.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  }
}
