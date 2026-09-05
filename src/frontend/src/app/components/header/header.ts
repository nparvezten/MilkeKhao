import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../services/tenant.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="main-header glass-panel">
      <div class="header-container">
        <!-- Brand Logo & Tenant Switcher -->
        <div class="brand-section">
          <div class="logo" (click)="viewChange.emit('storefront')" style="cursor: pointer;">
            <span class="logo-icon">🍲</span>
            <span class="logo-text">MilkeKhao</span>
          </div>

          <!-- Multi-Tenant Dropdown -->
          <div class="tenant-selector">
            <select
              [value]="tenantService.activeTenant().id"
              (change)="onTenantChange($event)"
              class="tenant-select"
            >
              @for (tenant of tenantService.availableTenants(); track tenant.id) {
                <option [value]="tenant.id">{{ tenant.name }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <nav class="nav-tabs">
          <button
            class="tab-btn"
            [class.active]="activeView === 'storefront'"
            (click)="viewChange.emit('storefront')"
          >
            🛍️ Storefront
          </button>
          <button
            class="tab-btn"
            [class.active]="activeView === 'kitchen'"
            (click)="viewChange.emit('kitchen')"
          >
            👨‍🍳 Kitchen KDS
          </button>
          <button
            class="tab-btn"
            [class.active]="activeView === 'driver'"
            (click)="viewChange.emit('driver')"
          >
            🛵 Driver Dispatch
          </button>
          <button
            class="tab-btn"
            [class.active]="activeView === 'owner'"
            (click)="viewChange.emit('owner')"
          >
            👑 Owner Analytics
          </button>
          <button
            class="tab-btn onboard-tab"
            [class.active]="activeView === 'onboarding'"
            (click)="viewChange.emit('onboarding')"
          >
            ✨ Add Restaurant
          </button>
        </nav>

        <!-- Cart Trigger Button -->
        <div class="header-actions">
          <button class="btn btn-primary cart-btn" (click)="cartService.toggleCart()">
            🛒 Cart
            @if (cartService.itemCount() > 0) {
              <span class="cart-badge">{{ cartService.itemCount() }}</span>
            }
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .main-header {
      position: sticky;
      top: 0;
      z-index: 100;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      margin-bottom: 24px;
      padding: 12px 24px;
    }
    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--accent-gold);
    }
    .logo-icon { font-size: 1.5rem; }
    .tenant-select {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      outline: none;
      cursor: pointer;
    }
    .nav-tabs {
      display: flex;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px;
      border-radius: var(--radius-md);
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .tab-btn.active {
      background: var(--accent-primary);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.4);
    }
    .onboard-tab {
      color: var(--accent-gold);
    }
    .cart-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 0.9rem;
    }
    .cart-badge {
      background: #ffffff;
      color: var(--accent-primary);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
    }
  `]
})
export class HeaderComponent {
  @Input() activeView: 'storefront' | 'kitchen' | 'driver' | 'owner' | 'onboarding' = 'storefront';
  @Output() viewChange = new EventEmitter<'storefront' | 'kitchen' | 'driver' | 'owner' | 'onboarding'>();

  constructor(
    public tenantService: TenantService,
    public cartService: CartService
  ) {}

  onTenantChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.tenantService.setTenant(select.value);
  }
}
