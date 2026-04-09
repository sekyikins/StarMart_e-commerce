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
  categoryId?: string;
  category: string;
  price: number;
  quantity: number;
  barcode: string;
  image_url?: string;
  description?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  maxQuantity: number;
  image_url?: string;
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
  paymentMethod: 'PAYSTACK' | 'PAY_ON_DELIVERY';
  paymentReference?: string;
  promoName?: string;
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

export interface StoreSettings {
  id: string;
  storeName: string;
  currency: string;
  taxRate: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  code: string;
  discountType: 'FLAT' | 'PERCENT';
  discountValue: number;
  isActive: boolean;
  minSubtotal?: number;
  startDate?: string;
  endDate?: string;
  usageCount: number;
  createdAt: string;
}
