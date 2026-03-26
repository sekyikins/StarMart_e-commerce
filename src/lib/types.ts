export type Role = 'ADMIN' | 'CUSTOMER';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export type AuthUser = Omit<UserRecord, 'passwordHash'>;

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  barcode: string;
  imageUrl?: string;
  description?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  maxQuantity: number;
}

export interface DeliveryPoint {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  deliveryPointId?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'ONLINE_PAYMENT' | 'PAY_ON_DELIVERY' | 'MOBILE_MONEY' | 'CASH_ON_DELIVERY' | 'CARD' | 'CASH';
  paymentReference?: string;
  createdAt: string;
}

export interface StorefrontUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyalty_points: number;
  created_at: string;
}
