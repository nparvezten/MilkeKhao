import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { StorefrontComponent } from './components/storefront/storefront';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer';
import { KitchenKdsComponent } from './components/kitchen-kds/kitchen-kds';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    StorefrontComponent,
    CartDrawerComponent,
    KitchenKdsComponent
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
        } @else {
          <app-kitchen-kds />
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
  readonly activeView = signal<'storefront' | 'kitchen'>('storefront');
}
