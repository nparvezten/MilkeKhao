import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { MenuItem } from '../models/menu.model';

describe('CartService', () => {
  let service: CartService;

  const mockItem1: MenuItem = {
    id: 'item-1',
    name: 'Paneer Butter Masala',
    description: 'Creamy tomato gravy',
    category: 'Main Course',
    price: 300,
    currency: 'INR',
    isVeg: true,
    isAvailable: true,
    imageUrl: ''
  };

  const mockItem2: MenuItem = {
    id: 'item-2',
    name: 'Butter Naan',
    description: 'Crisp clay oven bread',
    category: 'Breads',
    price: 50,
    currency: 'INR',
    isVeg: true,
    isAvailable: true,
    imageUrl: ''
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clearCart();
  });

  it('should initialize with empty cart and closed drawer', () => {
    expect(service.items().length).toBe(0);
    expect(service.itemCount()).toBe(0);
    expect(service.subtotal()).toBe(0);
    expect(service.totalAmount()).toBe(0);
    expect(service.isCartOpen()).toBe(false);
  });

  it('should add items and open cart automatically', () => {
    service.addItem(mockItem1);
    expect(service.items().length).toBe(1);
    expect(service.itemCount()).toBe(1);
    expect(service.subtotal()).toBe(300);
    expect(service.isCartOpen()).toBe(true);

    // Add same item again -> increments quantity
    service.addItem(mockItem1);
    expect(service.items().length).toBe(1);
    expect(service.itemCount()).toBe(2);
    expect(service.subtotal()).toBe(600);
  });

  it('should update item quantities and remove when reaching zero', () => {
    service.addItem(mockItem1);
    service.addItem(mockItem2);
    expect(service.items().length).toBe(2);

    service.updateQuantity(mockItem2.id, -1);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].menuItem.id).toBe(mockItem1.id);
  });

  it('should apply FIRST50 coupon with 50% discount capped at Rs.100', () => {
    service.addItem(mockItem1); // Rs.300
    const success = service.applyCoupon('FIRST50');

    expect(success).toBe(true);
    expect(service.appliedCoupon()).toBeTruthy();
    expect(service.discount()).toBe(100);
    expect(service.discountedSubtotal()).toBe(200);
    expect(service.gstAmount()).toBe(10); // 5% of 200 = 10
    expect(service.totalAmount()).toBe(210);
  });

  it('should enforce minimum order amount for FLAT100', () => {
    service.addItem(mockItem1); // Rs.300 (< Rs.399)
    const success = service.applyCoupon('FLAT100');

    expect(success).toBe(false);
    expect(service.appliedCoupon()).toBeNull();
    expect(service.couponError()).toContain('399');

    // Add second item: 300 + 50*2 = 400 (>= 399)
    service.addItem(mockItem2);
    service.addItem(mockItem2);
    const success2 = service.applyCoupon('FLAT100');

    expect(success2).toBe(true);
    expect(service.discount()).toBe(100);
  });

  it('should remove applied coupon and recalculate bill', () => {
    service.addItem(mockItem1);
    service.applyCoupon('FIRST50');
    expect(service.discount()).toBe(100);

    service.removeCoupon();
    expect(service.appliedCoupon()).toBeNull();
    expect(service.discount()).toBe(0);
    expect(service.subtotal()).toBe(300);
  });
});
