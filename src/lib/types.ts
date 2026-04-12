export type Role = 'ADMIN' | 'CUSTOMER';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export type AuthUser = Omit<UserRecord, 'passwordHash'>;

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  created_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  barcode: string;
  image_url?: string;
  images?: ProductImage[];
  description?: string;
  is_returnable?: boolean;
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  costPrice: number;
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
  productName?: string; // Populated via join
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  returnedQuantity?: number;
}

export interface Order {
  id: string;
  customerId: string;
  deliveryPointId?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethodId: 'PAYSTACK' | 'PAY_ON_DELIVERY';
  paymentReference?: string;
  promotionId?: string;
  promoName?: string; // From join
  isReturned?: boolean;
  createdAt: string;
}

export interface StorefrontUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyalty_points: number;
  type: 'IN_STORE' | 'ONLINE' | 'BOTH';
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

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Return {
  id: string;
  saleId: string | null;
  orderId: string | null;
  customerId: string | null;
  initiatedByStaffId: string | null;
  processedByStaffId: string | null;
  source: 'IN_STORE' | 'ONLINE';
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  refundAmount: number | null;
  rejectionReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  items: ReturnItem[];
  // Joined fields
  customerName?: string;
  initiatedByName?: string;
  processedByName?: string;
  paymentMethod?: string;
  paymentReference?: string;
}
