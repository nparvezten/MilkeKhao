import { Component, Input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../models/order.model';
import { SignalRService } from '../../services/signalr.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { DriverLocationService } from '../../services/driver-location.service';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tracking-card glass-panel animate-fade-in">
      <div class="tracking-header">
        <div>
          <h3>🚀 Live Order Tracking #{{ orderId }}</h3>
          <span class="live-pulse">🔴 Real-Time SignalR & GPS Pipeline Active</span>
        </div>

        <div class="header-actions">
          @if (pushService.permissionStatus() !== 'granted') {
            <button class="btn btn-secondary btn-sm" (click)="enablePushNotifications()">
              🔔 Enable Push Alerts
            </button>
          } @else {
            <span class="push-active-badge">✅ Push Alerts Active</span>
          }

          <button class="btn btn-secondary btn-sm test-btn" (click)="simulateNextState()">
            Advance Stage ⏭️
          </button>
        </div>
      </div>

      <!-- Progress Tracker Bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="getProgressPercentage()"></div>
        </div>
        <div class="steps-grid">
          <div class="step-item" [class.completed]="currentStatus() >= OrderStatus.Pending" [class.active]="currentStatus() === OrderStatus.Pending">
            <div class="step-icon">📋</div>
            <span class="step-label">Received</span>
          </div>
          <div class="step-item" [class.completed]="currentStatus() >= OrderStatus.Accepted" [class.active]="currentStatus() === OrderStatus.Accepted">
            <div class="step-icon">👍</div>
            <span class="step-label">Accepted</span>
          </div>
          <div class="step-item" [class.completed]="currentStatus() >= OrderStatus.Preparing" [class.active]="currentStatus() === OrderStatus.Preparing">
            <div class="step-icon">🔥</div>
            <span class="step-label">Cooking</span>
          </div>
          <div class="step-item" [class.completed]="currentStatus() >= OrderStatus.ReadyForPickup" [class.active]="currentStatus() === OrderStatus.ReadyForPickup">
            <div class="step-icon">🔔</div>
            <span class="step-label">Ready</span>
          </div>
          <div class="step-item" [class.completed]="currentStatus() >= OrderStatus.OutForDelivery" [class.active]="currentStatus() === OrderStatus.OutForDelivery">
            <div class="step-icon">🛵</div>
            <span class="step-label">On Way</span>
          </div>
          <div class="step-item" [class.completed]="currentStatus() >= OrderStatus.Delivered" [class.active]="currentStatus() === OrderStatus.Delivered">
            <div class="step-icon">🎉</div>
            <span class="step-label">Delivered</span>
          </div>
        </div>
      </div>

      <!-- Live Interactive GPS Delivery Map & Courier Telemetry View -->
      @if (currentStatus() === OrderStatus.OutForDelivery || currentStatus() === OrderStatus.ReadyForPickup) {
        <div class="live-map-card glass-panel animate-fade-in">
          <div class="map-header">
            <div class="driver-profile">
              <div class="driver-avatar">🛵</div>
              <div>
                <strong>Ramesh Kumar (Express Rider)</strong>
                <div class="telemetry-tags">
                  <span class="tag">⚡ Speed: {{ locationService.speedKmph() }} km/h</span>
                  <span class="tag tag-eta">⏱️ Estimated Arrival: {{ locationService.etaMinutes() }} mins</span>
                </div>
              </div>
            </div>
            <a href="tel:+919810012345" class="btn btn-secondary btn-sm call-btn">📞 Call Rider</a>
          </div>

          <!-- Interactive Visual Map Display -->
          <div class="map-viewport">
            <div class="map-grid-overlay"></div>

            <!-- Route Line -->
            <div class="route-line-container">
              <div class="route-line-bg"></div>
              <div class="route-line-active" [style.width.%]="locationService.routeProgress()"></div>

              <!-- Waypoint: Restaurant -->
              <div class="waypoint-pin pin-restaurant">
                <span class="pin-icon">🏢</span>
                <span class="pin-label">Swaad Foods</span>
              </div>

              <!-- Moving Courier Pin -->
              <div class="waypoint-pin pin-courier" [style.left.%]="locationService.routeProgress()">
                <span class="courier-beacon"></span>
                <span class="pin-icon">🛵</span>
                <span class="pin-label">Rider ({{ locationService.speedKmph() }} km/h)</span>
              </div>

              <!-- Waypoint: Customer Home -->
              <div class="waypoint-pin pin-customer">
                <span class="pin-icon">📍</span>
                <span class="pin-label">Your Address</span>
              </div>
            </div>

            <!-- Live Telemetry Sub-Strip -->
            <div class="map-footer-telemetry">
              <span>GPS Coords: {{ locationService.currentDriverPosition().latitude | number:'1.4-4' }}°N, {{ locationService.currentDriverPosition().longitude | number:'1.4-4' }}°E</span>
              <span>🛰️ Satellite Lock: High Accuracy 4G/GPS</span>
            </div>
          </div>
        </div>
      }

      <!-- Background Notification Alert Banner -->
      <div class="notification-banner">
        <span>📲 <strong>Close this tab anytime with confidence!</strong> We send background Push, SMS & WhatsApp alerts the moment your order reaches the next milestone.</span>
      </div>
    </div>
  `,
  styles: [`
    .tracking-card {
      padding: 24px;
      border-radius: var(--radius-lg);
      margin-top: 20px;
    }
    .tracking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .push-active-badge {
      font-size: 0.8rem;
      color: #00e676;
      font-weight: 700;
      background: rgba(0, 230, 118, 0.1);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid rgba(0, 230, 118, 0.3);
    }
    .live-pulse {
      font-size: 0.75rem;
      color: #00e676;
      font-weight: 700;
    }
    .progress-container {
      position: relative;
      margin: 28px 0 24px;
    }
    .progress-bar {
      height: 6px;
      background: var(--bg-secondary);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-gold), #00e676);
      transition: width var(--transition-medium);
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      text-align: center;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      opacity: 0.4;
      transition: all var(--transition-fast);
    }
    .step-item.completed, .step-item.active {
      opacity: 1;
    }
    .step-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .step-item.active .step-icon {
      border-color: var(--accent-primary);
      background: rgba(255, 107, 53, 0.2);
      box-shadow: 0 0 16px rgba(255, 107, 53, 0.4);
    }
    .step-item.completed .step-icon {
      border-color: var(--accent-secondary);
      background: rgba(0, 230, 118, 0.2);
    }
    .step-label {
      font-size: 0.75rem;
      font-weight: 700;
    }

    /* Live GPS Map Styling */
    .live-map-card {
      margin: 24px 0;
      padding: 16px 20px;
      border-radius: var(--radius-md);
      background: rgba(13, 19, 33, 0.85);
      border: 1px solid rgba(0, 230, 118, 0.3);
    }
    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .driver-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .driver-avatar {
      width: 42px;
      height: 42px;
      background: rgba(0, 230, 118, 0.15);
      border: 2px solid var(--accent-secondary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .telemetry-tags {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .tag {
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 8px;
      border-radius: 4px;
      color: var(--text-secondary);
    }
    .tag-eta {
      background: rgba(0, 230, 118, 0.15);
      color: #00e676;
      font-weight: 700;
    }
    .map-viewport {
      height: 170px;
      background: radial-gradient(circle at center, #17223b, #0b101d);
      border-radius: var(--radius-md);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.6);
    }
    .map-grid-overlay {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 24px 24px;
      pointer-events: none;
    }
    .route-line-container {
      position: relative;
      margin-top: 45px;
      height: 8px;
      width: 85%;
      margin-left: auto;
      margin-right: auto;
    }
    .route-line-bg {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
    }
    .route-line-active {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      background: linear-gradient(90deg, #ff6b35, #00e676);
      border-radius: 4px;
      transition: width 1s ease-in-out;
    }
    .waypoint-pin {
      position: absolute;
      top: -24px;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: left 1s ease-in-out;
    }
    .pin-restaurant {
      left: 0%;
    }
    .pin-customer {
      left: 100%;
    }
    .pin-icon {
      font-size: 1.4rem;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));
    }
    .pin-label {
      font-size: 0.65rem;
      font-weight: 700;
      white-space: nowrap;
      background: rgba(0, 0, 0, 0.7);
      padding: 2px 6px;
      border-radius: 3px;
      margin-top: 2px;
      color: #fff;
    }
    .pin-courier {
      z-index: 10;
    }
    .courier-beacon {
      position: absolute;
      top: 8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 230, 118, 0.4);
      animation: beacon-pulse 1.8s infinite;
      z-index: -1;
    }
    @keyframes beacon-pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    .map-footer-telemetry {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--text-muted);
      z-index: 2;
    }
    .notification-banner {
      background: rgba(0, 230, 118, 0.08);
      border: 1px solid rgba(0, 230, 118, 0.2);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
  `]
})
export class OrderTrackingComponent {
  @Input() orderId = 'ORD-7892';
  readonly currentStatus = signal<OrderStatus>(OrderStatus.Preparing);

  readonly OrderStatus = OrderStatus;

  constructor(
    private signalRService: SignalRService,
    public pushService: PushNotificationService,
    public locationService: DriverLocationService
  ) {
    // Automatically trigger GPS route simulation when order is Out for Delivery
    effect(() => {
      if (this.currentStatus() === OrderStatus.OutForDelivery) {
        this.locationService.startSimulatedBroadcast();
      }
    });
  }

  getProgressPercentage(): number {
    switch (this.currentStatus()) {
      case OrderStatus.Pending: return 10;
      case OrderStatus.Accepted: return 25;
      case OrderStatus.Preparing: return 50;
      case OrderStatus.ReadyForPickup: return 75;
      case OrderStatus.OutForDelivery: return 90;
      case OrderStatus.Delivered: return 100;
      default: return 0;
    }
  }

  async enablePushNotifications(): Promise<void> {
    const granted = await this.pushService.requestPermission();
    if (granted) {
      this.pushService.sendOrderAlert(
        this.orderId,
        '🍛 MilkeKhao Alerts Activated',
        `Live background updates are now active for Order #${this.orderId}.`
      );
    }
  }

  simulateNextState(): void {
    const nextStatus = (this.currentStatus() + 1) as OrderStatus;
    if (nextStatus <= OrderStatus.Delivered) {
      this.currentStatus.set(nextStatus);
      this.signalRService.simulateLiveStatusUpdate(this.orderId, nextStatus);

      // Dispatch push notification on milestone
      let title = 'Order Update';
      let message = `Order #${this.orderId} status changed.`;
      if (nextStatus === OrderStatus.Preparing) {
        title = '🔥 Cooking in Kitchen!';
        message = `Chef has started cooking your order #${this.orderId}.`;
      } else if (nextStatus === OrderStatus.ReadyForPickup) {
        title = '🔔 Order Packaged & Ready!';
        message = `Your order #${this.orderId} is packed and waiting for rider pickup.`;
      } else if (nextStatus === OrderStatus.OutForDelivery) {
        title = '🛵 Rider On The Way!';
        message = `Courier Ramesh is delivering your order #${this.orderId}. Track live on the map!`;
      } else if (nextStatus === OrderStatus.Delivered) {
        title = '🎉 Order Delivered!';
        message = `Enjoy your meal! Order #${this.orderId} has arrived safely.`;
      }

      this.pushService.sendOrderAlert(this.orderId, title, message);
    }
  }
}
