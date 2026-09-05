import { Component, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { TenantService } from '../../services/tenant.service';
import { AudioAlertService } from '../../services/audio-alert.service';
import { ThermalPrinterService } from '../../services/thermal-printer.service';
import { Order, OrderStatus, DeliveryMode } from '../../models/order.model';

@Component({
  selector: 'app-kitchen-kds',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kds-container animate-fade-in">
      <div class="kds-header glass-panel">
        <div>
          <h2>👨‍🍳 Kitchen Display System (KDS)</h2>
          <p class="kds-sub">Live kitchen workflow pipeline & status management</p>
        </div>

        <div class="kds-header-actions">
          <!-- Audio Alert Toggle -->
          <button
            class="btn audio-toggle-btn"
            [class.muted]="audioService.isMuted()"
            (click)="audioService.toggleMute()"
            title="Toggle Kitchen Order Chime"
          >
            {{ audioService.isMuted() ? '🔕 Chime Muted' : '🔔 Audio Alerts Active' }}
          </button>

          <div class="kds-stats">
            <div class="stat-box">
              <span class="stat-val">{{ pendingOrders().length }}</span>
              <span class="stat-lbl">Pending</span>
            </div>
            <div class="stat-box">
              <span class="stat-val">{{ preparingOrders().length }}</span>
              <span class="stat-lbl">In Prep</span>
            </div>
            <div class="stat-box">
              <span class="stat-val">{{ readyOrders().length }}</span>
              <span class="stat-lbl">Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div class="kds-board">
        <!-- Column 1: Pending Orders -->
        <div class="kds-column glass-panel">
          <div class="column-header col-pending">
            <h3>⏳ Pending Acceptance</h3>
            <span class="badge badge-pending">{{ pendingOrders().length }}</span>
          </div>
          <div class="orders-stack">
            @for (order of pendingOrders(); track order.id) {
              <div class="order-card card-new-incoming">
                <div class="card-top">
                  <span class="order-id">#{{ order.id }}</span>
                  <div class="card-badges">
                    <button class="kot-btn" (click)="printKot(order)" title="Print KOT Slip">🖨️ KOT</button>
                    <span class="badge" [class.badge-veg]="order.deliveryMode === DeliveryMode.Pickup">
                      {{ order.deliveryMode === DeliveryMode.Pickup ? '🛍️ Pickup' : '🛵 In-House' }}
                    </span>
                  </div>
                </div>
                <div class="card-items">
                  @for (item of order.items; track item.menuItemId) {
                    <div class="item-row">
                      <span class="item-qty">{{ item.quantity }}x</span>
                      <span class="item-name">{{ item.menuItemName }}</span>
                    </div>
                  }
                </div>
                @if (order.deliveryAddress) {
                  <div class="delivery-address">
                    📍 {{ order.deliveryAddress.street }}, {{ order.deliveryAddress.city }}
                  </div>
                }
                <div class="card-actions">
                  <button
                    class="btn btn-primary action-btn"
                    (click)="orderService.updateOrderStatus(order.id, OrderStatus.Accepted)"
                  >
                    ✓ Accept Order
                  </button>
                </div>
              </div>
            } @empty {
              <div class="column-empty">No pending orders</div>
            }
          </div>
        </div>

        <!-- Column 2: Accepted Orders -->
        <div class="kds-column glass-panel">
          <div class="column-header col-accepted">
            <h3>👍 Accepted</h3>
            <span class="badge badge-accepted">{{ acceptedOrders().length }}</span>
          </div>
          <div class="orders-stack">
            @for (order of acceptedOrders(); track order.id) {
              <div class="order-card">
                <div class="card-top">
                  <span class="order-id">#{{ order.id }}</span>
                  <div class="card-badges">
                    <button class="kot-btn" (click)="printKot(order)" title="Print KOT Slip">🖨️ KOT</button>
                    <span class="badge badge-status badge-accepted">Accepted</span>
                  </div>
                </div>
                <div class="card-items">
                  @for (item of order.items; track item.menuItemId) {
                    <div class="item-row">
                      <span class="item-qty">{{ item.quantity }}x</span>
                      <span class="item-name">{{ item.menuItemName }}</span>
                    </div>
                  }
                </div>
                <div class="card-actions">
                  <button
                    class="btn btn-secondary action-btn prep-btn"
                    (click)="orderService.updateOrderStatus(order.id, OrderStatus.Preparing)"
                  >
                    🔥 Start Cooking
                  </button>
                </div>
              </div>
            } @empty {
              <div class="column-empty">No accepted orders waiting</div>
            }
          </div>
        </div>

        <!-- Column 3: In Preparation -->
        <div class="kds-column glass-panel">
          <div class="column-header col-preparing">
            <h3>🔥 In Preparation</h3>
            <span class="badge badge-preparing">{{ preparingOrders().length }}</span>
          </div>
          <div class="orders-stack">
            @for (order of preparingOrders(); track order.id) {
              <div class="order-card card-active-prep">
                <div class="card-top">
                  <span class="order-id">#{{ order.id }}</span>
                  <div class="card-badges">
                    <button class="kot-btn" (click)="printKot(order)" title="Print KOT Slip">🖨️ KOT</button>
                    <span class="badge badge-status badge-preparing">Cooking...</span>
                  </div>
                </div>
                <div class="card-items">
                  @for (item of order.items; track item.menuItemId) {
                    <div class="item-row">
                      <span class="item-qty">{{ item.quantity }}x</span>
                      <span class="item-name">{{ item.menuItemName }}</span>
                    </div>
                  }
                </div>
                <div class="card-actions">
                  <button
                    class="btn btn-primary action-btn ready-btn"
                    (click)="orderService.updateOrderStatus(order.id, OrderStatus.ReadyForPickup)"
                  >
                    🔔 Mark Ready
                  </button>
                </div>
              </div>
            } @empty {
              <div class="column-empty">Kitchen burners are idle</div>
            }
          </div>
        </div>

        <!-- Column 4: Ready for Pickup / Delivery -->
        <div class="kds-column glass-panel">
          <div class="column-header col-ready">
            <h3>🔔 Ready for Pickup</h3>
            <span class="badge badge-ready">{{ readyOrders().length }}</span>
          </div>
          <div class="orders-stack">
            @for (order of readyOrders(); track order.id) {
              <div class="order-card card-ready-bg">
                <div class="card-top">
                  <span class="order-id">#{{ order.id }}</span>
                  <div class="card-badges">
                    <button class="kot-btn" (click)="printKot(order)" title="Print KOT Slip">🖨️ KOT</button>
                    <span class="badge badge-status badge-ready">Packaged</span>
                  </div>
                </div>
                <div class="card-items">
                  @for (item of order.items; track item.menuItemId) {
                    <div class="item-row">
                      <span class="item-qty">{{ item.quantity }}x</span>
                      <span class="item-name">{{ item.menuItemName }}</span>
                    </div>
                  }
                </div>
                <div class="card-actions">
                  <button
                    class="btn btn-secondary action-btn"
                    (click)="orderService.updateOrderStatus(order.id, OrderStatus.Delivered)"
                  >
                    🎉 Complete Order
                  </button>
                </div>
              </div>
            } @empty {
              <div class="column-empty">No orders awaiting dispatch</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kds-container {
      padding: 16px 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .kds-header {
      padding: 20px 32px;
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kds-header-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .audio-toggle-btn {
      background: rgba(46, 204, 113, 0.2);
      border: 1px solid rgba(46, 204, 113, 0.4);
      color: #2ecc71;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .audio-toggle-btn.muted {
      background: rgba(231, 76, 60, 0.2);
      border-color: rgba(231, 76, 60, 0.4);
      color: #e74c3c;
    }
    .kds-sub {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .kds-stats {
      display: flex;
      gap: 16px;
    }
    .stat-box {
      background: rgba(0, 0, 0, 0.3);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-val {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--accent-primary);
    }
    .stat-lbl {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .kds-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      align-items: start;
    }
    .kds-column {
      border-radius: var(--radius-lg);
      padding: 16px;
      min-height: 500px;
      display: flex;
      flex-direction: column;
    }
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 2px solid var(--border-color);
    }
    .column-header h3 {
      font-size: 1rem;
    }
    .orders-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex-grow: 1;
    }
    .order-card {
      background: rgba(19, 27, 46, 0.9);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    .card-new-incoming {
      border-color: rgba(255, 107, 53, 0.6);
      animation: pulse-border 2s infinite;
    }
    @keyframes pulse-border {
      0% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(255, 107, 53, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
    }
    .card-active-prep {
      border-color: rgba(124, 77, 255, 0.5);
      background: linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(19, 27, 46, 0.9));
    }
    .card-ready-bg {
      border-color: rgba(255, 107, 53, 0.5);
      background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(19, 27, 46, 0.9));
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-badges {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .kot-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      cursor: pointer;
      font-weight: 700;
    }
    .kot-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .order-id {
      font-weight: 800;
      font-size: 1.05rem;
      color: var(--accent-gold);
    }
    .card-items {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.85rem;
      background: rgba(0, 0, 0, 0.25);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
    }
    .item-row {
      display: flex;
      gap: 8px;
    }
    .item-qty {
      font-weight: 800;
      color: var(--accent-primary);
    }
    .delivery-address {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .card-actions {
      margin-top: 4px;
    }
    .action-btn {
      width: 100%;
      padding: 8px;
      font-size: 0.85rem;
    }
    .prep-btn {
      background: rgba(124, 77, 255, 0.2);
      color: var(--accent-purple);
      border: 1px solid rgba(124, 77, 255, 0.4);
    }
    .ready-btn {
      background: linear-gradient(135deg, var(--accent-gold), #e6a100);
      color: #000000;
    }
    .column-empty {
      text-align: center;
      padding: 48px 16px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  `]
})
export class KitchenKdsComponent {
  readonly OrderStatus = OrderStatus;
  readonly DeliveryMode = DeliveryMode;

  private previousPendingCount = 0;

  readonly pendingOrders = computed(() =>
    this.orderService.orders().filter(o => o.status === OrderStatus.Pending)
  );

  readonly acceptedOrders = computed(() =>
    this.orderService.orders().filter(o => o.status === OrderStatus.Accepted)
  );

  readonly preparingOrders = computed(() =>
    this.orderService.orders().filter(o => o.status === OrderStatus.Preparing)
  );

  readonly readyOrders = computed(() =>
    this.orderService.orders().filter(o => o.status === OrderStatus.ReadyForPickup)
  );

  constructor(
    public orderService: OrderService,
    public tenantService: TenantService,
    public audioService: AudioAlertService,
    private printerService: ThermalPrinterService
  ) {
    // Play chime whenever a new pending order arrives
    effect(() => {
      const currentPending = this.pendingOrders().length;
      if (currentPending > this.previousPendingCount && currentPending > 0) {
        this.audioService.playOrderChime();
      }
      this.previousPendingCount = currentPending;
    });
  }

  printKot(order: Order): void {
    const tenantName = this.tenantService.activeTenant().name;
    this.printerService.printKotSlip(order, tenantName);
  }
}
