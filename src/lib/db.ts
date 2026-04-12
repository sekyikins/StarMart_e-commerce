import { supabase } from './supabase';
import { Product, ProductImage, Order, OrderItem, StorefrontUser, StoreSettings, Review, Promotion, Return } from './types';
import bcrypt from 'bcryptjs';
export const generateReference = (method: string): string => {
  if (method === 'PAYSTACK') {
    return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 13 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
  if (error) {
    return {
      id: 'default',
      storeName: 'StarMart',
      currency: 'USD',
      taxRate: 0,
      receiptHeader: null,
      receiptFooter: null,
      updatedAt: new Date().toISOString()
    };
  }
  return {
    id: data.id,
    storeName: data.store_name,
    currency: data.currency,
    taxRate: Number(data.tax_rate),
    receiptHeader: data.receipt_header,
    receiptFooter: data.receipt_footer,
    updatedAt: data.updated_at
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(row: any): Product {
  if (!row) return {} as Product;
  
  const images = Array.isArray(row.product_images) ? row.product_images : [];
  const primaryImg = images.find((img: ProductImage) => img.is_primary) || images[0];

  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id || row.category,
    category: row.categories?.name || row.category || 'Uncategorized',
    price: Number(row.price),
    costPrice: Number(row.cost_price || 0),
    quantity: row.quantity,
    barcode: row.barcode,
    description: row.description ?? undefined,
    image_url: primaryImg?.image_url,
    images: images,
    is_returnable: row.is_returnable ?? true,
  };
}

function toReturn(row: {
  id: string;
  sale_id: string | null;
  order_id: string | null;
  customer_id: string | null;
  initiated_by_staff_id: string | null;
  processed_by_staff_id: string | null;
  source: string;
  reason: string;
  status: string;
  refund_amount: number | string | null;
  rejection_reason: string | null;
  requested_at: string;
  processed_at: string | null;
  completed_at: string | null;
  items?: { id: string; return_id: string; product_id: string; products: { name: string } | null; quantity: number; unit_price: number | string; subtotal: number | string; }[];
  return_items?: { id: string; return_id: string; product_id: string; products: { name: string } | null; quantity: number; unit_price: number | string; subtotal: number | string; }[];
  order?: { payment_method_id: string | null; payment_reference: string | null } | null;
  sale?: { payment_method_id: string | null; payment_reference: string | null } | null;
}): Return {
  return {
    id: row.id,
    saleId: row.sale_id,
    orderId: row.order_id,
    customerId: row.customer_id,
    initiatedByStaffId: row.initiated_by_staff_id,
    processedByStaffId: row.processed_by_staff_id,
    source: row.source as Return['source'],
    reason: row.reason,
    status: row.status as Return['status'],
    refundAmount: row.refund_amount ? Number(row.refund_amount) : null,
    rejectionReason: row.rejection_reason,
    requestedAt: row.requested_at,
    processedAt: row.processed_at,
    completedAt: row.completed_at,
    items: (row.items ?? row.return_items ?? []).map((i) => ({
      id: i.id,
      returnId: i.return_id,
      productId: i.product_id,
      productName: i.products?.name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      subtotal: Number(i.subtotal)
    })),
    paymentMethod: row.order?.payment_method_id || row.sale?.payment_method_id || undefined,
    paymentReference: row.order?.payment_reference || row.sale?.payment_reference || undefined
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(row: any): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    deliveryPointId: row.delivery_point_id,
    deliveryAddress: row.delivery_address,
    totalAmount: Number(row.total_amount),
    deliveryFee: Number(row.delivery_fee || 0),
    status: row.status as Order['status'],
    paymentMethodId: row.payment_method_id as Order['paymentMethodId'],
    paymentReference: row.payment_reference,
    promotionId: row.promotion_id,
    promoName: row.promotions?.name,
    isReturned: row.is_returned,
    createdAt: row.created_at,
    items: (row.transaction_items ?? []).map(toOrderItem)
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.products?.name, // From join
    price: Number(row.price),
    costPrice: Number(row.cost_price || 0),
    quantity: row.quantity,
    subtotal: Number(row.subtotal),
    returnedQuantity: row.returned_quantity || 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDeliveryPoint(row: any) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    active: row.active,
  };
}

// ─── Products ───────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*, product_images(*), categories(name)').order('name');
  if (error) throw error;
  return (data ?? []).map(toProduct);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products').select('*, product_images(*), categories(name)').eq('category', category).order('name');
  if (error) throw error;
  return (data ?? []).map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*), categories(name)')
    .eq('id', id)
    .single();
  if (error) return null;
  return toProduct(data);
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('categories').select('name');
  if (error) throw error;
  return (data ?? []).map((r: { name: string }) => r.name).sort();
}

// ─── Delivery Points ──────────────────────────────────────────────────────────
export async function getDeliveryPoints() {
  const { data, error } = await supabase
    .from('delivery_points').select('*').eq('active', true).order('name');
  if (error) throw error;
  return (data ?? []).map(toDeliveryPoint);
}

// ─── Auth (unified customers) ──────────────────────────────────────────────────
export async function getStorefrontUserById(id: string) {
  const { data, error } = await supabase
    .from('customers').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function getStorefrontUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('customers').select('*').eq('email', email.toLowerCase()).maybeSingle();
  if (error) return null;
  return data;
}

export async function createStorefrontUser(name: string, email: string, password: string, phone?: string): Promise<StorefrontUser> {
  const hash = await bcrypt.hash(password, 10);
  const normalizedEmail = email.toLowerCase();
  
  // 1. Check if user already exists (likely as an IN_STORE customer)
  const { data: existing } = await supabase
    .from('customers')
    .select('id, type')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    if (existing.type === 'IN_STORE') {
      // UPGRADE: This was an in-store customer, now they are BOTH
      const { data, error } = await supabase
        .from('customers')
        .update({ 
          name, 
          password_hash: hash, 
          phone: phone ?? null, 
          type: 'BOTH' 
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Conflict: Already an ONLINE or BOTH user
      throw new Error('Account already exists. Please sign in.');
    }
  }

  // 2. New user
  const { data, error } = await supabase
    .from('customers')
    .insert({ 
      name, 
      email: normalizedEmail, 
      password_hash: hash, 
      phone: phone ?? null, 
      loyalty_points: 100,
      type: 'ONLINE' 
    })
    .select().single();
    
  if (error) throw error;
  return data;
}

export async function updateStorefrontUser(id: string, updates: { name?: string; phone?: string }) {
  await supabase.from('customers').update(updates).eq('id', id);
}

export async function deleteStorefrontAccount(id: string) {
  await supabase.from('customers').delete().eq('id', id);
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function placeOrder(orderData: {
  customerId?: string;
  deliveryPointId?: string;
  deliveryAddress?: string;
  totalAmount: number;
  deliveryFee: number;
  paymentMethodId: string;
  items: { productId: string; price: number; costPrice: number; quantity: number; subtotal: number }[];
  promotionId?: string;
  paymentReference?: string;
}) {
  const { data: orderRow, error: orderErr } = await supabase
    .from('online_orders')
    .insert({
      customer_id: orderData.customerId ?? null,
      delivery_point_id: orderData.deliveryPointId ?? null,
      delivery_address: orderData.deliveryAddress ?? null,
      total_amount: orderData.totalAmount,
      delivery_fee: orderData.deliveryFee,
      payment_method_id: orderData.paymentMethodId,
      payment_reference: orderData.paymentReference || (orderData.paymentMethodId !== 'PAY_ON_DELIVERY' ? generateReference(orderData.paymentMethodId) : null),
      promotion_id: orderData.promotionId || null,
      status: 'PENDING',
    }).select().single();
  if (orderErr) throw orderErr;

  const itemRows = orderData.items.map(i => ({
    order_id: orderRow.id,
    product_id: i.productId,
    price: i.price,
    cost_price: i.costPrice || 0,
    quantity: i.quantity,
    subtotal: i.subtotal,
  }));
  const { error: itemsErr } = await supabase.from('transaction_items').insert(itemRows);
  if (itemsErr) throw itemsErr;

  const { error: paymentErr } = await supabase.from('payments').insert({
    order_id: orderRow.id,
    amount: orderData.totalAmount,
    payment_method_id: orderData.paymentMethodId,
  });
  if (paymentErr) throw paymentErr;

  // Update product inventory
  for (const item of orderData.items) {
    const { data: prod } = await supabase.from('products').select('quantity').eq('id', item.productId).single();
    if (prod) {
      const newQty = Math.max(0, prod.quantity - item.quantity);
      await supabase.from('products').update({ quantity: newQty }).eq('id', item.productId);
      
      await supabase.from('inventory').insert({
        product_id: item.productId,
        change: -item.quantity,
        reason: 'SALE',
        customer_id: orderData.customerId,
      });
    }
  }

  // Handle Promotion Usage Count
  if (orderData.promotionId) {
    const { data: promo } = await supabase.from('promotions').select('usage_count').eq('id', orderData.promotionId).single();
    if (promo) {
      await supabase.from('promotions').update({ usage_count: (promo.usage_count || 0) + 1 }).eq('id', orderData.promotionId);
    }
  }

  // Update Loyalty Points
  if (orderData.customerId) {
    const { data: customer } = await supabase.from('customers').select('loyalty_points, last_purchase_date, order_count').eq('id', orderData.customerId).single();
    if (customer) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = customer.last_purchase_date;
      let newPoints = Number(customer.loyalty_points || 0);
      
      if (lastDate !== today) {
        newPoints += 50;
      } else {
        newPoints += 10;
      }

      await supabase.from('customers').update({ 
        loyalty_points: newPoints,
        last_purchase_date: today,
        order_count: Number(customer.order_count || 0) + 1
      }).eq('id', orderData.customerId);
    }
  }

  return toOrder({ ...orderRow, transaction_items: itemRows });
}

export async function getOrdersByUser(storefrontUserId: string) {
  const { data: onlineOrders, error } = await supabase
    .from('online_orders')
    .select('*, transaction_items(*, products(name)), promotions(name)')
    .eq('customer_id', storefrontUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  if (!onlineOrders || onlineOrders.length === 0) return [];

  // Fetch returns to calculate returned quantities for these orders
  const { data: returnData } = await supabase
    .from('returns')
    .select('id, order_id, status, return_items(product_id, quantity)')
    .eq('customer_id', storefrontUserId)
    .eq('status', 'COMPLETED'); // Only count successfully resolved/refunded returns

  const orderReturnsMap: Record<string, Record<string, number>> = {};
  if (returnData) {
    for (const r of returnData) {
      if (r.order_id) {
        if (!orderReturnsMap[r.order_id]) orderReturnsMap[r.order_id] = {};
        for (const i of r.return_items) {
          orderReturnsMap[r.order_id][i.product_id] = (orderReturnsMap[r.order_id][i.product_id] || 0) + i.quantity;
        }
      }
    }
  }

  // Inject returned_quantity into transaction_items
  const enrichedOrders = onlineOrders.map(order => {
    const enrichedItems = order.transaction_items.map((item: { product_id: string; [key: string]: unknown }) => ({
      ...item,
      returned_quantity: orderReturnsMap[order.id]?.[item.product_id] || 0
    }));
    return { ...order, transaction_items: enrichedItems };
  });

  return enrichedOrders.map(toOrder);
}

export async function cancelOrder(orderId: string) {
  const { data: order, error: fetchErr } = await supabase
    .from('online_orders')
    .select('*, transaction_items(*)')
    .eq('id', orderId)
    .single();
    
  if (fetchErr || !order) throw new Error('Order not found');
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new Error(`Order cannot be cancelled in its current state: ${order.status}`);
  }

  const { error: updateErr } = await supabase
    .from('online_orders')
    .update({ status: 'CANCELLED' })
    .eq('id', orderId);
    
  if (updateErr) throw updateErr;

  for (const item of order.transaction_items) {
    const { data: prod } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
    if (prod) {
      await supabase.from('products').update({ quantity: prod.quantity + item.quantity }).eq('id', item.product_id);
      await supabase.from('inventory').insert({
        product_id: item.product_id,
        change: item.quantity,
        reason: 'RESTOCK',
      });
    }
  }
}

// ─── Promotions ───────────────────────────────────────────────────────────────
export async function getPromotionByCode(code: string): Promise<Promotion | null> {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    code: data.code,
    discountType: data.discount_type as Promotion['discountType'],
    discountValue: Number(data.discount_value),
    isActive: data.is_active,
    minSubtotal: data.min_subtotal ? Number(data.min_subtotal) : undefined,
    startDate: data.start_date || undefined,
    endDate: data.end_date || undefined,
    usageCount: Number(data.usage_count || 0),
    createdAt: data.created_at,
  };
}


// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function getReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*, customers(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    productId: r.product_id,
    customerId: r.customer_id,
    customerName: (r.customers as { name: string } | null)?.name || 'Anonymous',
    rating: r.rating,
    comment: r.comment || undefined,
    createdAt: r.created_at
  })) as Review[];
}

export async function addReview(productId: string, storefrontUserId: string, rating: number, comment: string) {
  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    customer_id: storefrontUserId,
    rating,
    comment,
  });
  if (error) throw error;
}

// ─── Returns ──────────────────────────────────────────────────────────────────
export async function getReturnsByUser(customerId: string): Promise<Return[]> {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      items:return_items(*, products(name)),
      order:online_orders(payment_method_id, payment_reference),
      sale:sales(payment_method_id, payment_reference)
    `)
    .eq('customer_id', customerId)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toReturn);
}

export async function checkReturnEligibility(orderId: string, customerId: string): Promise<void> {
  // Rule: Max 2 returns per order/sale
  const { count: returnCount } = await supabase
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .not('status', 'eq', 'REJECTED');
    
  if (returnCount && returnCount >= 2) {
    throw new Error('Maximum limit of 2 returns per order has been reached.');
  }

  // Rule: Max 2 returns per customer per day
  const today = new Date().toISOString().split('T')[0]; // simple YYYY-MM-DD
  const { count: todayReturnCount } = await supabase
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .gte('requested_at', `${today}T00:00:00.000Z`);

  if (todayReturnCount && todayReturnCount >= 2) {
    throw new Error('You have reached the daily limit of 2 return requests.');
  }
}

export async function requestOnlineReturn(
  orderId: string, 
  customerId: string, 
  reason: string, 
  items: { productId: string, quantity: number, unitPrice: number }[]
) {
  // 1. Calculate refund (80%). Delivery fee is excluded based on policy.
  const returnItemsSubtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  const refundAmount = Number((returnItemsSubtotal * 0.8).toFixed(2));

  // 2. Insert Returns header
  const { data: returnRec, error } = await supabase
    .from('returns')
    .insert({
      order_id: orderId,
      customer_id: customerId,
      source: 'ONLINE',
      reason,
      status: 'REQUESTED',
      refund_amount: refundAmount
    })
    .select()
    .single();

  if (error) throw error;

  // 3. Insert items
  const itemRows = items.map(i => ({
    return_id: returnRec.id,
    product_id: i.productId,
    quantity: i.quantity,
    unit_price: i.unitPrice,
    subtotal: Number((i.quantity * i.unitPrice).toFixed(2))
  }));

  const { error: itemsErr } = await supabase.from('return_items').insert(itemRows);
  if (itemsErr) throw itemsErr;

  return returnRec;
}
