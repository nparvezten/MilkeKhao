import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MenuItem } from '../models/menu.model';
import { TenantService } from './tenant.service';
import { API_BASE_URL } from '../constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  readonly menuItems = signal<MenuItem[]>([]);
  readonly isLoading = signal<boolean>(false);

  private readonly fallbackMenuItems: MenuItem[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Special Butter Chicken',
      description: 'Tender tandoori chicken simmered in rich tomato, butter & cashew gravy.',
      category: 'Main Course',
      price: 380,
      currency: 'INR',
      isVeg: false,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Paneer Butter Masala',
      description: 'Cottage cheese cubes tossed in creamy spiced onion-tomato velvet gravy.',
      category: 'Main Course',
      price: 320,
      currency: 'INR',
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop'
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Amritsari Paneer Tikka',
      description: 'Charcoal grilled cottage cheese marinated in hung curd & secret spices.',
      category: 'Starters',
      price: 290,
      currency: 'INR',
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop'
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Hyderabadi Chicken Dum Biryani',
      description: 'Long grain Basmati rice layered with spiced marinated chicken & saffron.',
      category: 'Main Course',
      price: 340,
      currency: 'INR',
      isVeg: false,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop'
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Dal Makhani Gold',
      description: 'Overnight slow cooked black lentils infused with white butter & cream.',
      category: 'Main Course',
      price: 280,
      currency: 'INR',
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop'
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Butter Garlic Naan',
      description: 'Leavened flatbread freshly baked in tandoor with fresh garlic & melted butter.',
      category: 'Breads & Rice',
      price: 65,
      currency: 'INR',
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500&auto=format&fit=crop'
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      name: 'Gulab Jamun with Rabri',
      description: 'Hot milk-solid dumplings soaked in cardamom rose syrup served with rabri.',
      category: 'Desserts',
      price: 150,
      currency: 'INR',
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop'
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Kesari Mango Lassi',
      description: 'Chilled thick yogurt smoothie blended with Alphonso mango pulp & saffron.',
      category: 'Beverages',
      price: 120,
      currency: 'INR',
      isVeg: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop'
    }
  ];

  constructor(
    private http: HttpClient,
    private tenantService: TenantService
  ) {
    this.fetchMenu();
  }

  fetchMenu(): void {
    const tenantId = this.tenantService.activeTenant().id;
    const headers = new HttpHeaders({
      'X-Tenant-Id': tenantId
    });

    this.isLoading.set(true);
    this.http.get<any[]>(`${API_BASE_URL}/api/v1/menu`, { headers }).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const mapped: MenuItem[] = data.map(item => ({
            id: item.id || item.Id,
            name: item.name || item.Name,
            description: item.description || item.Description,
            category: item.categoryName || item.category || 'Chef Specials',
            price: item.price ?? item.Price ?? 250,
            currency: item.currency || item.Currency || 'INR',
            isVeg: item.name?.toLowerCase().includes('paneer') || item.name?.toLowerCase().includes('dal') || item.name?.toLowerCase().includes('naan') || item.name?.toLowerCase().includes('lassi') || item.name?.toLowerCase().includes('veg'),
            isAvailable: item.isAvailable ?? item.IsAvailable ?? true,
            imageUrl: item.imageUrl || item.ImageUrl || 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop'
          }));
          this.menuItems.set(mapped);
        } else {
          this.menuItems.set(this.fallbackMenuItems);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.menuItems.set(this.fallbackMenuItems);
        this.isLoading.set(false);
      }
    });
  }
}
