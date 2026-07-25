import { Injectable, signal } from '@angular/core';
import { OrderService } from './order.service';
import { TenantService } from './tenant.service';
import { OrderStatus } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  readonly isConnected = signal<boolean>(true);
  readonly lastEventMessage = signal<string>('Connected to Live Notification Stream');

  constructor(
    private orderService: OrderService,
    private tenantService: TenantService
  ) {
    this.initMockLiveStream();
  }

  private initMockLiveStream(): void {
    // Simulates SignalR WebSocket live updates for storefront and Kitchen KDS
    console.log('[SignalR Service] Connected to tenant channel:', this.tenantService.activeTenant().id);
  }

  simulateLiveStatusUpdate(orderId: string, newStatus: OrderStatus): void {
    this.orderService.updateOrderStatus(orderId, newStatus);
    this.lastEventMessage.set(`Order #${orderId} status changed to ${OrderStatus[newStatus]}`);
  }
}
