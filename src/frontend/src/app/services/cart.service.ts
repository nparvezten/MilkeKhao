import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../models/menu.model';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  readonly items = signal<CartItem[]>([]);
  readonly isCartOpen = signal<boolean>(false);
  readonly appliedCoupon = signal<AppliedCoupon | null>(null);
  readonly couponError = signal<string | null>(null);

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0)
  );

  readonly discount = computed(() => {
    const coupon = this.appliedCoupon();
    if (!coupon) return 0;
    return Math.min(coupon.discountAmount, this.subtotal());
  });

  readonly discountedSubtotal = computed(() =>
    Math.max(0, this.subtotal() - this.discount())
  );

  readonly gstAmount = computed(() =>
    Math.round(this.discountedSubtotal() * 0.05 * 100) / 100
  );

  readonly totalAmount = computed(() =>
    Math.round((this.discountedSubtotal() + this.gstAmount()) * 100) / 100
  );

  toggleCart(): void {
    this.isCartOpen.update(open => !open);
  }

  openCart(): void {
    this.isCartOpen.set(true);
  }

  closeCart(): void {
    this.isCartOpen.set(false);
  }

  applyCoupon(code: string): boolean {
    const cleanCode = code.trim().toUpperCase();
    this.couponError.set(null);

    const sub = this.subtotal();
    if (sub <= 0) {
      this.couponError.set('Cart is empty');
      return false;
    }

    if (cleanCode === 'FIRST50') {
      const discount = Math.min(sub * 0.50, 100);
      this.appliedCoupon.set({
        code: cleanCode,
        discountAmount: Math.round(discount * 100) / 100,
        message: '50% OFF applied (Savings capped at ₹100)'
      });
      return true;
    }

    if (cleanCode === 'FLAT100') {
      if (sub < 399) {
        this.couponError.set('FLAT100 requires minimum order of ₹399');
        return false;
      }
      this.appliedCoupon.set({
        code: cleanCode,
        discountAmount: 100,
        message: 'Flat ₹100 instant discount applied!'
      });
      return true;
    }

    if (cleanCode === 'MILKE20') {
      const discount = Math.min(sub * 0.20, 150);
      this.appliedCoupon.set({
        code: cleanCode,
        discountAmount: Math.round(discount * 100) / 100,
        message: '20% festive discount applied!'
      });
      return true;
    }

    this.couponError.set('Invalid or expired coupon code');
    return false;
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponError.set(null);
  }

  addItem(menuItem: MenuItem): void {
    this.items.update(currentItems => {
      const existingIndex = currentItems.findIndex(i => i.menuItem.id === menuItem.id);
      if (existingIndex > -1) {
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }
      return [...currentItems, { menuItem, quantity: 1 }];
    });
    this.openCart();
  }

  updateQuantity(menuItemId: string, delta: number): void {
    this.items.update(currentItems => {
      return currentItems.map(item => {
        if (item.menuItem.id === menuItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  }

  removeItem(menuItemId: string): void {
    this.items.update(currentItems => currentItems.filter(i => i.menuItem.id !== menuItemId));
  }

  clearCart(): void {
    this.items.set([]);
    this.appliedCoupon.set(null);
    this.couponError.set(null);
  }
}
