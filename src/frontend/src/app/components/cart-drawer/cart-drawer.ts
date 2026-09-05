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

            <!-- Coupon & Promo Code Section -->
            <div class="section-card coupon-section">
              <h4 class="section-title">🏷️ Offers & Promo Code</h4>
              @if (!cartService.appliedCoupon()) {
                <div class="coupon-input-group">
                  <input
                    type="text"
                    [(ngModel)]="couponCodeInput"
                    placeholder="Enter Coupon (e.g. FIRST50)"
                    class="form-input coupon-input"
                  />
                  <button
                    class="btn btn-secondary apply-btn"
                    [disabled]="!couponCodeInput.trim()"
                    (click)="applyCoupon()"
                  >
                    Apply
                  </button>
                </div>

                @if (cartService.couponError()) {
                  <span class="coupon-err">{{ cartService.couponError() }}</span>
                }

                <div class="suggested-coupons">
                  <button class="coupon-pill" (click)="selectCoupon('FIRST50')">
                    <strong>FIRST50</strong> (50% OFF)
                  </button>
                  <button class="coupon-pill" (click)="selectCoupon('FLAT100')">
                    <strong>FLAT100</strong> (₹100 OFF)
                  </button>
                  <button class="coupon-pill" (click)="selectCoupon('MILKE20')">
                    <strong>MILKE20</strong> (20% OFF)
                  </button>
                </div>
              } @else {
                <div class="applied-coupon-card">
                  <div class="applied-info">
                    <span class="applied-badge">✓ {{ cartService.appliedCoupon()?.code }}</span>
                    <span class="applied-desc">{{ cartService.appliedCoupon()?.message }}</span>
                  </div>
                  <button class="remove-coupon-btn" (click)="cartService.removeCoupon()">Remove</button>
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
                <span>₹{{ cartService.subtotal().toFixed(2) }}</span>
              </div>
              @if (cartService.discount() > 0) {
                <div class="summary-row discount-row">
                  <span>Discount ({{ cartService.appliedCoupon()?.code }})</span>
                  <span>- ₹{{ cartService.discount().toFixed(2) }}</span>
                </div>
              }
              <div class="summary-row">
                <span>GST (5%)</span>
                <span>₹{{ cartService.gstAmount().toFixed(2) }}</span>
              </div>
              <div class="summary-row total-row">
                <span>Total Amount Payable</span>
                <span>₹{{ cartService.totalAmount().toFixed(2) }}</span>
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
                <span>Place Order • ₹{{ cartService.totalAmount().toFixed(2) }}</span>
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
      gap: 12px;
    }
    .item-title {
      font-size: 0.95rem;
      margin: 0;
    }
    .item-subprice {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px;
      border-radius: var(--radius-sm);
    }
    .qty-btn {
      background: transparent;
      border: none;
      color: var(--text-primary);
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
    }
    .qty-btn:hover { background: rgba(255, 255, 255, 0.1); }
    .qty-count { font-size: 0.85rem; font-weight: 700; width: 16px; text-align: center; }
    .item-total { font-weight: 700; font-size: 0.95rem; color: var(--accent-gold); }
    .section-card {
      background: rgba(0, 0, 0, 0.2);
      padding: 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .section-title {
      font-size: 0.9rem;
      margin-bottom: 12px;
      color: var(--text-secondary);
    }
    .coupon-input-group {
      display: flex;
      gap: 8px;
    }
    .coupon-input {
      flex-grow: 1;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .apply-btn {
      padding: 8px 16px;
      font-size: 0.85rem;
    }
    .coupon-err {
      display: block;
      margin-top: 6px;
      color: #e74c3c;
      font-size: 0.75rem;
    }
    .suggested-coupons {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .coupon-pill {
      background: rgba(255, 107, 53, 0.1);
      border: 1px dashed var(--accent-primary);
      color: var(--text-primary);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .coupon-pill:hover {
      background: rgba(255, 107, 53, 0.25);
    }
    .applied-coupon-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(46, 204, 113, 0.15);
      border: 1px solid rgba(46, 204, 113, 0.4);
      padding: 10px 12px;
      border-radius: var(--radius-sm);
    }
    .applied-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .applied-badge {
      font-weight: 800;
      color: #2ecc71;
      font-size: 0.85rem;
    }
    .applied-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .remove-coupon-btn {
      background: transparent;
      border: none;
      color: #e74c3c;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .option-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 10px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .option-btn.active {
      background: rgba(255, 107, 53, 0.2);
      border-color: var(--accent-primary);
      color: #ffffff;
      font-weight: 700;
    }
    .address-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .form-input {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      outline: none;
    }
    .summary-card {
      background: rgba(0, 0, 0, 0.3);
      padding: 16px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .discount-row {
      color: #2ecc71;
      font-weight: 700;
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

  couponCodeInput = '';
  street = 'B-12, Connaught Place';
  city = 'New Delhi';
  postalCode = '110001';

  constructor(
    public cartService: CartService,
    public orderService: OrderService,
    public tenantService: TenantService
  ) {}

  applyCoupon(): void {
    if (this.couponCodeInput.trim()) {
      const success = this.cartService.applyCoupon(this.couponCodeInput);
      if (success) {
        this.couponCodeInput = '';
      }
    }
  }

  selectCoupon(code: string): void {
    this.couponCodeInput = code;
    this.applyCoupon();
  }

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
