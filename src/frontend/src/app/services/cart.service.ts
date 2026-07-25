import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../models/menu.model';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  readonly items = signal<CartItem[]>([]);
  readonly isCartOpen = signal<boolean>(false);

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  readonly totalAmount = computed(() =>
    this.items().reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0)
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
  }
}
