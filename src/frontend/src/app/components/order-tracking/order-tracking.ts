import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../models/order.model';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tracking-card glass-panel animate-fade-in">
      <div class="tracking-header">
        <div>
          <h3>🚀 Live Order Status #{{ orderId }}</h3>
          <span class="live-pulse">🔴 Real-Time SignalR Pipeline Active</span>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="simulateNextState()">Test Next Stage</button>
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
          <div class="step-item" [class.completed]="currentStatus() >= OrderStatus.Delivered" [class.active]="currentStatus() === OrderStatus.Delivered">
            <div class="step-icon">🎉</div>
            <span class="step-label">Dispatched</span>
          </div>
        </div>
      </div>

      <!-- Closed-Session Notification Banner -->
      <div class="notification-banner">
        <span>📲 <strong>No need to keep this tab open!</strong> We will automatically send SMS & Email notifications to your phone when your food is ready.</span>
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
    }
    .live-pulse {
      font-size: 0.75rem;
      color: #00e676;
      font-weight: 700;
    }
    .progress-container {
      position: relative;
      margin: 32px 0 24px;
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
      background: linear-gradient(90deg, var(--accent-primary), var(--accent-gold));
      transition: width var(--transition-medium);
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
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
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
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

  constructor(private signalRService: SignalRService) {}

  getProgressPercentage(): number {
    switch (this.currentStatus()) {
      case OrderStatus.Pending: return 10;
      case OrderStatus.Accepted: return 30;
      case OrderStatus.Preparing: return 60;
      case OrderStatus.ReadyForPickup: return 85;
      case OrderStatus.Delivered: return 100;
      default: return 0;
    }
  }

  simulateNextState(): void {
    const nextStatus = (this.currentStatus() + 1) as OrderStatus;
    if (nextStatus <= OrderStatus.Delivered) {
      this.currentStatus.set(nextStatus);
      this.signalRService.simulateLiveStatusUpdate(this.orderId, nextStatus);
    }
  }
}
