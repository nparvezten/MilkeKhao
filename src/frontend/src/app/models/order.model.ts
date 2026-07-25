export enum OrderStatus {
  Pending = 0,
  Accepted = 1,
  Preparing = 2,
  ReadyForPickup = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Cancelled = 6,
  Refunded = 7
}

export enum DeliveryMode {
  Pickup = 0,
  InHouseDelivery = 1,
  AggregatorDelivery = 2
}

export enum PaymentMethod {
  UpiIntent = 0,
  UpiQr = 1,
  Razorpay = 2,
  PayU = 3
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  changedAt: string;
  performedByUserId?: string;
  notes?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  driverId?: string;
  status: OrderStatus;
  deliveryMode: DeliveryMode;
  paymentMethod: PaymentMethod;
  deliveryAddress?: Address;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  isPaid: boolean;
  createdAt: string;
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderCommand {
  customerId: string;
  deliveryMode: DeliveryMode;
  paymentMethod: PaymentMethod;
  deliveryAddress?: Address;
  items: CreateOrderItemRequest[];
}
