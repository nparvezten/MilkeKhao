import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { StorefrontComponent } from './components/storefront/storefront';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer';
import { KitchenKdsComponent } from './components/kitchen-kds/kitchen-kds';
import { DriverDashboardComponent } from './components/driver-dashboard/driver-dashboard';
import { OwnerDashboardComponent } from './components/owner-dashboard/owner-dashboard';
import { OnboardingComponent } from './components/onboarding/onboarding';

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

      <app-cart-drawer />
    </div>
  `,
  styles: [`
    .app-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex-grow: 1;
      padding-bottom: 40px;
    }
  `]
})
export class App {
  readonly activeView = signal<'storefront' | 'kitchen' | 'driver' | 'owner' | 'onboarding'>('storefront');
}
