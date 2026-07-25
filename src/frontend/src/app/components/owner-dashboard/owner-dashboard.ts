import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
}

export interface TopItem {
  name: string;
  category: string;
  qtySold: number;
  revenue: number;
}

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="owner-container animate-fade-in">
      <div class="owner-header glass-panel">
        <div>
          <h2>👑 Restaurant Owner Analytics & Executive Dashboard</h2>
          <p class="sub-text">Multi-tenant business metrics, revenue, and delivery analytics</p>
        </div>
        <div class="date-filter">
          <span class="badge badge-accepted">📅 Last 30 Days</span>
        </div>
      </div>

      <!-- KPI Metrics Cards Grid -->
      <div class="kpi-grid">
        <div class="kpi-card glass-panel">
          <span class="kpi-label">Gross Revenue</span>
          <span class="kpi-value text-gold">₹{{ summary().totalSales.toLocaleString('en-IN') }}</span>
          <span class="kpi-trend trend-up">↑ 14.8% vs last month</span>
        </div>

        <div class="kpi-card glass-panel">
          <span class="kpi-label">Total Orders Handled</span>
          <span class="kpi-value text-primary">{{ summary().totalOrders }}</span>
          <span class="kpi-sub">{{ summary().completedOrders }} Delivered • {{ summary().cancelledOrders }} Cancelled</span>
        </div>

        <div class="kpi-card glass-panel">
          <span class="kpi-label">Average Order Value (AOV)</span>
          <span class="kpi-value">₹{{ summary().avgOrderValue.toFixed(2) }}</span>
          <span class="kpi-trend trend-up">↑ 5.2% optimization</span>
        </div>

        <div class="kpi-card glass-panel">
          <span class="kpi-label">Fulfillment Success Rate</span>
          <span class="kpi-value text-green">98.2%</span>
          <span class="kpi-sub">Kitchen Prep Avg: 14 mins</span>
        </div>
      </div>

      <!-- Section: Best Selling Items & Delivery Breakdown -->
      <div class="details-grid">
        <div class="detail-card glass-panel">
          <h3>🔥 Top Selling Menu Items</h3>
          <div class="top-items-list">
            @for (item of topItems(); track item.name; let idx = $index) {
              <div class="item-rank-row">
                <span class="rank-num">#{{ idx + 1 }}</span>
                <div class="item-details">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-cat">{{ item.category }}</span>
                </div>
                <div class="item-stats">
                  <span class="qty-badge">{{ item.qtySold }} orders</span>
                  <span class="rev-val">₹{{ item.revenue.toLocaleString('en-IN') }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="detail-card glass-panel">
          <h3>🛵 Fulfillment Mode Breakdown</h3>
          <div class="mode-breakdown-list">
            <div class="mode-row">
              <div class="mode-info">
                <span>🛍️ Pickup (Direct Customer)</span>
                <span class="mode-pct">65%</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: 65%"></div></div>
            </div>

            <div class="mode-row">
              <div class="mode-info">
                <span>🛵 In-House Express Delivery</span>
                <span class="mode-pct">25%</span>
              </div>
              <div class="bar-bg"><div class="bar-fill fill-purple" style="width: 25%"></div></div>
            </div>

            <div class="mode-row">
              <div class="mode-info">
                <span>📦 Aggregator Dispatch (Swiggy / Zomato)</span>
                <span class="mode-pct">10%</span>
              </div>
              <div class="bar-bg"><div class="bar-fill fill-gold" style="width: 10%"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .owner-container {
      padding: 24px;
      max-width: 1300px;
      margin: 0 auto;
    }
    .owner-header {
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
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }
    .kpi-card {
      padding: 20px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .kpi-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }
    .kpi-value {
      font-size: 1.8rem;
      font-weight: 800;
    }
    .text-gold { color: var(--accent-gold); }
    .text-primary { color: var(--accent-primary); }
    .text-green { color: var(--accent-secondary); }
    .kpi-trend {
      font-size: 0.75rem;
      font-weight: 700;
    }
    .trend-up { color: var(--accent-secondary); }
    .kpi-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .details-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 20px;
    }
    .detail-card {
      padding: 24px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .top-items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .item-rank-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }
    .rank-num {
      font-weight: 800;
      color: var(--accent-gold);
      font-size: 1.1rem;
      width: 32px;
    }
    .item-details {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    .item-name {
      font-weight: 700;
      font-size: 0.9rem;
    }
    .item-cat {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .item-stats {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .qty-badge {
      background: var(--bg-secondary);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .rev-val {
      font-weight: 800;
      color: var(--accent-gold);
      font-size: 0.9rem;
    }
    .mode-breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .mode-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }
    .mode-pct {
      font-weight: 800;
      color: var(--accent-gold);
    }
    .bar-bg {
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: 4px;
    }
    .fill-purple { background: var(--accent-purple); }
    .fill-gold { background: var(--accent-gold); }
  `]
})
export class OwnerDashboardComponent {
  readonly summary = signal<SalesSummary>({
    totalSales: 184500,
    totalOrders: 342,
    avgOrderValue: 539.47,
    completedOrders: 336,
    cancelledOrders: 6
  });

  readonly topItems = signal<TopItem[]>([
    { name: 'Special Butter Chicken Bowl', category: 'Main Course', qtySold: 142, revenue: 53960 },
    { name: 'Amritsari Paneer Tikka', category: 'Starters', qtySold: 118, revenue: 38940 },
    { name: 'Dal Makhani Swaad Special', category: 'Main Course', qtySold: 94, revenue: 26320 },
    { name: 'Garlic Butter Naan (2 Pcs)', category: 'Breads & Rice', qtySold: 210, revenue: 16800 }
  ]);
}
