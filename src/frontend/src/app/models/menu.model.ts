export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}
