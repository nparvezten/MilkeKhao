import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../models/menu.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="storefront-container animate-fade-in">
      <!-- Hero Banner -->
      <div class="glass-panel hero-card">
        <div class="hero-content">
          <span class="badge badge-veg">🌱 Authentic Indian Kitchen</span>
          <h2 class="hero-title">Culinary Perfection, Delivered Fresh</h2>
          <p class="hero-sub">Explore rich tandoori spices, slow-cooked gravies & artisanal biryanis.</p>
        </div>
        <div class="hero-badge">
          <span>⚡ Direct UPI Order</span>
          <small>Zero Gateway Markup</small>
        </div>
      </div>

      <!-- Controls & Filters -->
      <div class="filter-bar glass-panel">
        <div class="category-pills">
          @for (cat of categories; track cat) {
            <button
              class="pill-btn"
              [class.active]="selectedCategory() === cat"
              (click)="selectedCategory.set(cat)"
            >
              {{ cat }}
            </button>
          }
        </div>

        <div class="filter-actions">
          <label class="veg-toggle">
            <input
              type="checkbox"
              [checked]="onlyVeg()"
              (change)="onlyVeg.set(!onlyVeg())"
            />
            <span>🌱 Veg Only</span>
          </label>

          <input
            type="text"
            placeholder="Search menu..."
            class="search-input"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
          />
        </div>
      </div>

      <!-- Menu Grid -->
      <div class="menu-grid">
        @for (item of filteredMenuItems(); track item.id) {
          <div class="menu-card glass-panel">
            <div class="card-image-wrapper">
              <img [src]="item.imageUrl" [alt]="item.name" class="card-img" />
              <span class="badge" [class.badge-veg]="item.isVeg" [class.badge-nonveg]="!item.isVeg">
                {{ item.isVeg ? '🌱 VEG' : '🍖 NON-VEG' }}
              </span>
            </div>

            <div class="card-body">
              <div class="card-header">
                <h3 class="item-name">{{ item.name }}</h3>
                <span class="item-price">₹{{ item.price }}</span>
              </div>
              <p class="item-desc">{{ item.description }}</p>

              <div class="card-footer">
                <span class="category-tag">{{ item.category }}</span>
                <button
                  class="btn btn-primary add-btn"
                  (click)="cartService.addItem(item)"
                >
                  + Add to Cart
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state glass-panel">
            <p>No delicious items match your filter criteria.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .storefront-container {
      padding: 16px 24px;
      max-width: 1280px;
      margin: 0 auto;
    }
    .hero-card {
      padding: 32px 40px;
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(19, 27, 46, 0.8));
    }
    .hero-title {
      font-size: 2.2rem;
      margin: 8px 0;
      color: var(--text-primary);
    }
    .hero-sub {
      color: var(--text-secondary);
      font-size: 1rem;
    }
    .hero-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: rgba(0, 0, 0, 0.4);
      padding: 12px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-focus);
      color: var(--accent-primary);
      font-weight: 700;
    }
    .hero-badge small {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .filter-bar {
      padding: 16px 24px;
      border-radius: var(--radius-lg);
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .category-pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pill-btn {
      padding: 8px 18px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .pill-btn.active, .pill-btn:hover {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    .filter-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .veg-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent-secondary);
      cursor: pointer;
    }
    .search-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      outline: none;
      font-size: 0.85rem;
    }
    .search-input:focus {
      border-color: var(--accent-primary);
    }
    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    .menu-card {
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
      display: flex;
      flex-direction: column;
    }
    .menu-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    }
    .card-image-wrapper {
      position: relative;
      height: 180px;
      overflow: hidden;
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .card-image-wrapper .badge {
      position: absolute;
      top: 12px;
      right: 12px;
    }
    .card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .item-name {
      font-size: 1.15rem;
      color: var(--text-primary);
    }
    .item-price {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--accent-gold);
    }
    .item-desc {
      color: var(--text-secondary);
      font-size: 0.85rem;
      margin-bottom: 16px;
      flex-grow: 1;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }
    .category-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .add-btn {
      padding: 8px 16px;
      font-size: 0.85rem;
    }
    .empty-state {
      grid-column: 1 / -1;
      padding: 48px;
      text-align: center;
      color: var(--text-muted);
      border-radius: var(--radius-lg);
    }
  `]
})
export class StorefrontComponent {
  readonly categories = ['All', 'Starters', 'Main Course', 'Breads & Rice', 'Desserts', 'Beverages'];
  readonly selectedCategory = signal<string>('All');
  readonly onlyVeg = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  private readonly rawMenuItems: MenuItem[] = [
    {
      id: 'm-1',
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
      id: 'm-2',
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
      id: 'm-3',
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
      id: 'm-4',
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
      id: 'm-5',
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
      id: 'm-6',
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
      id: 'm-7',
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
      id: 'm-8',
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

  readonly filteredMenuItems = computed(() => {
    const category = this.selectedCategory();
    const vegOnly = this.onlyVeg();
    const query = this.searchQuery().toLowerCase().trim();

    return this.rawMenuItems.filter(item => {
      const matchCategory = category === 'All' || item.category === category;
      const matchVeg = !vegOnly || item.isVeg;
      const matchQuery = !query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      return matchCategory && matchVeg && matchQuery;
    });
  });

  constructor(public cartService: CartService) {}

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.searchQuery.set(target.value);
    }
  }
}
