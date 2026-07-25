import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { TenantService } from '../../services/tenant.service';
import { DeliveryMode, PaymentMethod, CreateOrderCommand, Address } from '../../models/order.model';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (cartService.isCartOpen()) {
      <div class="cart-backdrop" (click)="cartService.closeCart()"></div>
      <div class="cart-drawer glass-panel animate-fade-in">
        <div class="drawer-header">
          <h2>Your Food Order</h2>
          <button class="close-btn" (click)="cartService.closeCart()">✕</button>
        </div>

        @if (cartService.items().length > 0) {
          <div class="drawer-body">
            <!-- Items List -->
            <div class="cart-items-list">
              @for (item of cartService.items(); track item.menuItem.id) {
                <div class="cart-item">
                  <div class="item-info">
                    <span class="badge" [class.badge-veg]="item.menuItem.isVeg" [class.badge-nonveg]="!item.menuItem.isVeg">
                      {{ item.menuItem.isVeg ? '🌱' : '🍖' }}
                    </span>
                    <div>
                      <h4 class="item-title">{{ item.menuItem.name }}</h4>
                      <span class="item-subprice">₹{{ item.menuItem.price }}</span>
                    </div>
                  </div>

                  <div class="quantity-controls">
                    <button class="qty-btn" (click)="cartService.updateQuantity(item.menuItem.id, -1)">-</button>
                    <span class="qty-count">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="cartService.updateQuantity(item.menuItem.id, 1)">+</button>
                  </div>

                  <span class="item-total">₹{{ item.menuItem.price * item.quantity }}</span>
                </div>
              }
            </div>

            <!-- Fulfillment Options -->
            <div class="section-card">
              <h4 class="section-title">1. Select Delivery Mode</h4>
              <div class="options-grid">
                <button
                  class="option-btn"
                  [class.active]="selectedDeliveryMode() === DeliveryMode.Pickup"
                  (click)="selectedDeliveryMode.set(DeliveryMode.Pickup)"
                >
                  🛍️ Pickup
                </button>
                <button
                  class="option-btn"
                  [class.active]="selectedDeliveryMode() === DeliveryMode.InHouseDelivery"
                  (click)="selectedDeliveryMode.set(DeliveryMode.InHouseDelivery)"
                >
                  🛵 In-House Express
                </button>
              </div>

              @if (selectedDeliveryMode() === DeliveryMode.InHouseDelivery) {
                <div class="address-fields">
                  <input type="text" [(ngModel)]="street" placeholder="Street Address / Flat No." class="form-input" />
                  <div class="form-row">
                    <input type="text" [(ngModel)]="city" placeholder="City" class="form-input" />
                    <input type="text" [(ngModel)]="postalCode" placeholder="Pincode" class="form-input" />
                  </div>
                </div>
              }
            </div>

            <!-- Payment Methods -->
            <div class="section-card">
              <h4 class="section-title">2. Choose Payment Method</h4>
              <div class="options-grid">
                <button
                  class="option-btn"
                  [class.active]="selectedPaymentMethod() === PaymentMethod.UpiIntent"
                  (click)="selectedPaymentMethod.set(PaymentMethod.UpiIntent)"
                >
                  ⚡ UPI Direct (No Fee)
                </button>
                <button
                  class="option-btn"
                  [class.active]="selectedPaymentMethod() === PaymentMethod.UpiQr"
                  (click)="selectedPaymentMethod.set(PaymentMethod.UpiQr)"
                >
                  📱 UPI QR Code
                </button>
              </div>
            </div>

            <!-- Bill Summary -->
            <div class="summary-card">
              <div class="summary-row">
                <span>Item Subtotal</span>
                <span>₹{{ cartService.totalAmount() }}</span>
              </div>
              <div class="summary-row">
                <span>GST (5%)</span>
                <span>₹{{ (cartService.totalAmount() * 0.05).toFixed(2) }}</span>
              </div>
              <div class="summary-row total-row">
                <span>Total Amount Payable</span>
                <span>₹{{ (cartService.totalAmount() * 1.05).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="drawer-footer">
            <button
              class="btn btn-primary place-order-btn"
              [disabled]="orderService.isSubmitting()"
              (click)="onPlaceOrder()"
            >
              @if (orderService.isSubmitting()) {
                <span>Processing Payment...</span>
              } @else {
                <span>Place Order • ₹{{ (cartService.totalAmount() * 1.05).toFixed(2) }}</span>
              }
            </button>
          </div>
        } @else {
          <div class="empty-cart">
            <span class="empty-icon">🛒</span>
            <p>Your cart is currently empty.</p>
            <small>Add delicious items from the menu to get started!</small>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .cart-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 200;
    }
    .cart-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 480px;
      max-width: 100vw;
      z-index: 201;
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--glass-border);
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
    }
    .drawer-header {
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-color);
    }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
    }
    .drawer-body {
      padding: 24px;
      overflow-y: auto;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .item-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .item-title {
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .item-subprice {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-secondary);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }
    .qty-btn {
      background: transparent;
      border: none;
      color: var(--accent-primary);
      font-weight: 800;
      font-size: 1rem;
      cursor: pointer;
      width: 20px;
    }
    .qty-count {
      font-size: 0.85rem;
      font-weight: 700;
    }
    .item-total {
      font-weight: 700;
      color: var(--accent-gold);
      font-size: 0.9rem;
    }
    .section-card {
      background: rgba(0, 0, 0, 0.2);
      padding: 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .section-title {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .option-btn {
      padding: 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .option-btn.active {
      background: rgba(255, 107, 53, 0.15);
      color: var(--accent-primary);
      border-color: var(--accent-primary);
    }
    .address-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
    .form-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      outline: none;
    }
    .form-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 8px;
    }
    .summary-card {
      background: rgba(255, 107, 53, 0.05);
      padding: 16px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 107, 53, 0.2);
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.85rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
    }
    .total-row {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--accent-gold);
      border-top: 1px dashed var(--border-color);
      padding-top: 8px;
      margin-top: 4px;
    }
    .drawer-footer {
      padding: 20px 24px;
      border-top: 1px solid var(--border-color);
    }
    .place-order-btn {
      width: 100%;
      padding: 14px;
      font-size: 1rem;
    }
    .empty-cart {
      padding: 64px 24px;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 12px;
    }
  `]
})
export class CartDrawerComponent {
  readonly DeliveryMode = DeliveryMode;
  readonly PaymentMethod = PaymentMethod;

  readonly selectedDeliveryMode = signal<DeliveryMode>(DeliveryMode.Pickup);
  readonly selectedPaymentMethod = signal<PaymentMethod>(PaymentMethod.UpiIntent);

  street = 'B-12, Connaught Place';
  city = 'New Delhi';
  postalCode = '110001';

  constructor(
    public cartService: CartService,
    public orderService: OrderService,
    public tenantService: TenantService
  ) {}

  async onPlaceOrder(): Promise<void> {
    let deliveryAddress: Address | undefined = undefined;
    if (this.selectedDeliveryMode() === DeliveryMode.InHouseDelivery) {
      deliveryAddress = {
        street: this.street,
        city: this.city,
        state: 'Delhi',
        postalCode: this.postalCode
      };
    }

    const command: CreateOrderCommand = {
      customerId: 'cust-user-1',
      deliveryMode: this.selectedDeliveryMode(),
      paymentMethod: this.selectedPaymentMethod(),
      deliveryAddress,
      items: this.cartService.items().map(i => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity
      }))
    };

    await this.orderService.placeOrder(command);
    this.cartService.clearCart();
    this.cartService.closeCart();
    alert('🎉 Order Placed Successfully! Sent directly to Kitchen Display System (KDS).');
  }
}
