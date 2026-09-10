import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { StorefrontComponent } from './components/storefront/storefront';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer';
import { KitchenKdsComponent } from './components/kitchen-kds/kitchen-kds';
import { DriverDashboardComponent } from './components/driver-dashboard/driver-dashboard';
import { OwnerDashboardComponent } from './components/owner-dashboard/owner-dashboard';
import { OnboardingComponent } from './components/onboarding/onboarding';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StorefrontComponent,
    CartDrawerComponent,
    KitchenKdsComponent,
    DriverDashboardComponent,
    OwnerDashboardComponent,
    OnboardingComponent
  ],
  template: `
    <div class="app-wrapper">
      <app-header
        [activeView]="activeView()"
        (viewChange)="activeView.set($event)"
      />

      <main class="main-content">
        @if (activeView() === 'storefront') {
          <app-storefront />
        } @else if (activeView() === 'kitchen') {
          <app-kitchen-kds />
        } @else if (activeView() === 'driver') {
          <app-driver-dashboard />
        } @else if (activeView() === 'owner') {
          <app-owner-dashboard />
        } @else if (activeView() === 'onboarding') {
          <app-onboarding (completed)="activeView.set('storefront')" />
        }
      </main>

      <!-- Floating Quick Cart Trigger (Visible on bottom when items added) -->
      @if (cartService.itemCount() > 0 && activeView() === 'storefront') {
        <button class="floating-cart-btn animate-fade-in" (click)="cartService.openCart()">
          <span class="cart-icon">🛒</span>
          <span class="cart-details">
            <strong>{{ cartService.itemCount() }} Items</strong> • ₹{{ cartService.totalAmount().toFixed(2) }}
          </span>
          <span class="view-cart-arrow">View Cart →</span>
        </button>
      }

      <app-cart-drawer />
    </div>
  `,
  styles: [`
    .app-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .main-content {
      flex-grow: 1;
      padding-bottom: 80px;
    }
    .floating-cart-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 150;
      background: linear-gradient(135deg, var(--accent-primary), #ff3e3e);
      color: #ffffff;
      border: none;
      padding: 14px 24px;
      border-radius: var(--radius-full);
      box-shadow: 0 8px 32px rgba(255, 107, 53, 0.6);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1rem;
      cursor: pointer;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .floating-cart-btn:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 36px rgba(255, 107, 53, 0.8);
    }
    .cart-icon {
      font-size: 1.3rem;
    }
    .cart-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      font-size: 0.85rem;
    }
    .view-cart-arrow {
      font-weight: 800;
      font-size: 0.95rem;
      margin-left: 8px;
    }
  `]
})
export class App {
  readonly activeView = signal<'storefront' | 'kitchen' | 'driver' | 'owner' | 'onboarding'>('storefront');

  constructor(public cartService: CartService) {}
}
