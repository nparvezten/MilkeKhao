import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AssignedDelivery {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  amount: number;
  status: 'Assigned' | 'PickedUp' | 'Delivered';
}

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="driver-container animate-fade-in">
      <div class="driver-header glass-panel">
        <div>
          <h2>🛵 Driver Delivery Dispatch</h2>
          <p class="sub-text">In-House express order fulfillment manager</p>
        </div>
        <div class="driver-badge">
          <span>Active Driver: Ramesh Kumar</span>
        </div>
      </div>

      <div class="deliveries-grid">
        @for (item of deliveries(); track item.id) {
          <div class="delivery-card glass-panel">
            <div class="card-top">
              <span class="delivery-id">#{{ item.id }}</span>
              <span class="badge" [class.badge-preparing]="item.status === 'Assigned'" [class.badge-accepted]="item.status === 'PickedUp'" [class.badge-ready]="item.status === 'Delivered'">
                {{ item.status }}
              </span>
            </div>

            <div class="customer-details">
              <h4>{{ item.customerName }}</h4>
              <p>📞 {{ item.customerPhone }}</p>
              <p class="address">📍 {{ item.deliveryAddress }}</p>
            </div>

            <div class="amount-row">
              <span>Cash / UPI on Delivery</span>
              <span class="amount">₹{{ item.amount }}</span>
            </div>

            <div class="card-actions">
              @if (item.status === 'Assigned') {
                <button class="btn btn-primary action-btn" (click)="updateStatus(item.id, 'PickedUp')">
                  📦 Mark Picked Up
                </button>
              } @else if (item.status === 'PickedUp') {
                <button class="btn btn-secondary action-btn" (click)="updateStatus(item.id, 'Delivered')">
                  ✅ Mark Delivered
                </button>
              } @else {
                <button class="btn btn-secondary action-btn" disabled>
                  🎉 Delivery Complete
                </button>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state glass-panel">
            <span>🛵</span>
            <p>No active deliveries assigned at this moment.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .driver-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .driver-header {
      padding: 20px 32px;
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sub-text {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .driver-badge {
      background: rgba(0, 230, 118, 0.1);
      border: 1px solid var(--accent-secondary);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      color: var(--accent-secondary);
      font-weight: 700;
      font-size: 0.85rem;
    }
    .deliveries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }
    .delivery-card {
      padding: 20px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .delivery-id {
      font-weight: 800;
      color: var(--accent-gold);
    }
    .customer-details h4 {
      margin-bottom: 4px;
    }
    .customer-details p {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .address {
      color: var(--text-muted) !important;
      margin-top: 4px;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      background: rgba(0, 0, 0, 0.25);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }
    .amount {
      font-weight: 800;
      color: var(--accent-gold);
    }
    .action-btn {
      width: 100%;
      padding: 10px;
    }
    .empty-state {
      grid-column: 1 / -1;
      padding: 64px;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-state span {
      font-size: 3rem;
      display: block;
      margin-bottom: 12px;
    }
  `]
})
export class DriverDashboardComponent {
  readonly deliveries = signal<AssignedDelivery[]>([
    {
      id: 'DEL-101',
      customerName: 'Anand Verma',
      customerPhone: '+91 98100 12345',
      deliveryAddress: 'Flat 402, Green Valley Apartments, Sector 62, Noida',
      amount: 680,
      status: 'Assigned'
    },
    {
      id: 'DEL-102',
      customerName: 'Priya Sharma',
      customerPhone: '+91 98765 43210',
      deliveryAddress: 'House 14, Ring Road, Lajpat Nagar, Delhi',
      amount: 450,
      status: 'PickedUp'
    }
  ]);

  updateStatus(id: string, newStatus: 'Assigned' | 'PickedUp' | 'Delivered'): void {
    this.deliveries.update(items =>
      items.map(item => (item.id === id ? { ...item, status: newStatus } : item))
    );
  }
}
