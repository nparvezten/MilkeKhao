import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../services/tenant.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="glass-panel header-container">
      <div class="brand-section">
        <div class="logo-icon">🍲</div>
        <div>
          <h1 class="brand-title">MilkeKhao</h1>
          <p class="brand-subtitle">Multi-Tenant Food Delivery</p>
        </div>
      </div>

      <div class="tenant-selector">
        <span class="tenant-label">Restaurant Context:</span>
        <select
          [value]="tenantService.activeTenant().id"
          (change)="onTenantChange($event)"
          class="tenant-dropdown"
        >
          @for (tenant of tenantService.availableTenants; track tenant.id) {
            <option [value]="tenant.id">{{ tenant.name }}</option>
          }
        </select>
      </div>

      <div class="nav-controls">
        <div class="view-toggle">
          <button
            class="toggle-btn"
            [class.active]="activeView === 'storefront'"
            (click)="viewChange.emit('storefront')"
          >
            🛒 Customer Store
          </button>
          <button
            class="toggle-btn"
            [class.active]="activeView === 'kitchen'"
            (click)="viewChange.emit('kitchen')"
          >
            👨‍🍳 Kitchen KDS
          </button>
        </div>

        @if (activeView === 'storefront') {
          <button class="btn btn-primary cart-trigger" (click)="cartService.toggleCart()">
            <span>🛒 Cart</span>
            @if (cartService.itemCount() > 0) {
              <span class="cart-badge">{{ cartService.itemCount() }}</span>
              <span class="cart-total">₹{{ cartService.totalAmount() }}</span>
            }
          </button>
        }
      </div>
    </header>
  `,
  styles: [`
    .header-container {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      margin: 12px 16px;
      border-radius: var(--radius-lg);
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      font-size: 2rem;
      background: rgba(255, 107, 53, 0.15);
      padding: 6px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 107, 53, 0.3);
    }
    .brand-title {
      font-size: 1.5rem;
      background: linear-gradient(135deg, var(--text-primary), var(--accent-primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .tenant-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.2);
      padding: 6px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .tenant-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .tenant-dropdown {
      background: transparent;
      color: var(--accent-gold);
      font-weight: 600;
      font-size: 0.85rem;
      border: none;
      outline: none;
      cursor: pointer;
    }
    .nav-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .view-toggle {
      display: flex;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .toggle-btn {
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .toggle-btn.active {
      background: var(--accent-primary);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    }
    .cart-trigger {
      gap: 8px;
    }
    .cart-badge {
      background: #ffffff;
      color: var(--accent-primary);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
    }
    .cart-total {
      font-weight: 700;
      border-left: 1px solid rgba(255, 255, 255, 0.3);
      padding-left: 8px;
    }
  `]
})
export class HeaderComponent {
  @Input() activeView: 'storefront' | 'kitchen' = 'storefront';
  @Output() viewChange = new EventEmitter<'storefront' | 'kitchen'>();

  constructor(
    public tenantService: TenantService,
    public cartService: CartService
  ) {}

  onTenantChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target) {
      this.tenantService.setTenant(target.value);
    }
  }
}
