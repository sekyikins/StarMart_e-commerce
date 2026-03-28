import { supabase } from './supabase';
import { Product, CartItem, Order, OrderItem, StorefrontUser, StoreSettings, Review } from './types';
import bcrypt from 'bcryptjs';

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
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id || row.category,
    category: row.categories?.name || row.category || 'Uncategorized',
    price: Number(row.price),
    quantity: row.quantity,
    barcode: row.barcode,
    description: row.description ?? undefined,
    image_url: row.product_images?.[0]?.image_url || row.image_url || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(row: any): Order {
  return {
    id: row.id,
    customerId: row.e_customer_id,
    deliveryPointId: row.delivery_point_id,
    deliveryAddress: row.delivery_address,
    totalAmount: Number(row.total_amount),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    createdAt: row.created_at,
    items: (row.online_order_items ?? []).map(toOrderItem),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrderItem(row: any): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    price: Number(row.price),
    quantity: row.quantity,
    subtotal: Number(row.subtotal),
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

// ─── Products (shared with POS) ───────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*, product_images(image_url), categories(name)').order('name');
  if (error) throw error;
  return (data ?? []).map(toProduct);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products').select('*, product_images(image_url), categories(name)').eq('category', category).order('name');
  if (error) throw error;
  return (data ?? []).map(toProduct);
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

// ─── Auth (storefront users) ──────────────────────────────────────────────────
export async function getStorefrontUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('e_customer').select('*').eq('email', email.toLowerCase()).maybeSingle();
  if (error) return null;
  return data;
}

export async function createStorefrontUser(name: string, email: string, password: string, phone?: string): Promise<StorefrontUser> {
  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('e_customer')
    .insert({ name, email: email.toLowerCase(), password_hash: hash, phone: phone ?? null, loyalty_points: 100 })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateStorefrontUser(id: string, updates: { name?: string; phone?: string }) {
  await supabase.from('e_customer').update(updates).eq('id', id);
}

export async function deleteStorefrontAccount(id: string) {
  // Clear cart and other related data usually handled by ON DELETE CASCADE in DB
  await supabase.from('e_customer').delete().eq('id', id);
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function placeOrder(orderData: {
  storefrontUserId?: string;
  deliveryPointId?: string;
  deliveryAddress?: string;
  totalAmount: number;
  paymentMethod: string;
  items: { productId: string; productName: string; price: number; quantity: number; subtotal: number }[];
}) {
  const { data: orderRow, error: orderErr } = await supabase
    .from('online_orders')
    .insert({
      e_customer_id: orderData.storefrontUserId ?? null,
      delivery_point_id: orderData.deliveryPointId ?? null,
      delivery_address: orderData.deliveryAddress ?? null,
      total_amount: orderData.totalAmount,
      payment_method: orderData.paymentMethod,
      status: 'PENDING',
    }).select().single();
  if (orderErr) throw orderErr;

  const itemRows = orderData.items.map(i => ({
    order_id: orderRow.id,
    product_id: i.productId,
    product_name: i.productName,
    price: i.price,
    quantity: i.quantity,
    subtotal: i.subtotal,
  }));
  const { error: itemsErr } = await supabase.from('online_order_items').insert(itemRows);
  if (itemsErr) throw itemsErr;

  // Update product inventory (decrement quantity)
  for (const item of orderData.items) {
    // 1. Get current quantity
    const { data: prod } = await supabase.from('products').select('quantity').eq('id', item.productId).single();
    if (prod) {
      const newQty = Math.max(0, prod.quantity - item.quantity);
      await supabase.from('products').update({ quantity: newQty }).eq('id', item.productId);
      
      // 2. Log to inventory
      await supabase.from('inventory').insert({
        product_id: item.productId,
        change: -item.quantity,
        reason: 'SALE', // Label as SALE
      });
    }
  }

  // 3. Clear persistent cart
  if (orderData.storefrontUserId) {
    await supabase.from('e_cart').delete().eq('e_customer_id', orderData.storefrontUserId);
  }

  // 4. Update Loyalty Points (50 pts per purchase day)
  if (orderData.storefrontUserId) {
    const { data: customer } = await supabase.from('e_customer').select('loyalty_points, last_purchase_date, order_count').eq('id', orderData.storefrontUserId).single();
    if (customer) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = customer.last_purchase_date;
      let newPoints = Number(customer.loyalty_points || 0);
      
      if (lastDate !== today) {
        newPoints += 50;
      } else {
        newPoints += 10;
      }

      await supabase.from('e_customer').update({ 
        loyalty_points: newPoints,
        last_purchase_date: today,
        order_count: Number(customer.order_count || 0) + 1
      }).eq('id', orderData.storefrontUserId);
    }
  }

  return toOrder({ ...orderRow, online_order_items: itemRows });
}

export async function getOrdersByUser(storefrontUserId: string) {
  const { data, error } = await supabase
    .from('online_orders')
    .select('*, online_order_items(*)')
    .eq('e_customer_id', storefrontUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toOrder);
}

export async function cancelOrder(orderId: string) {
  // 1. Get order details first
  const { data: order, error: fetchErr } = await supabase
    .from('online_orders')
    .select('*, online_order_items(*)')
    .eq('id', orderId)
    .single();
    
  if (fetchErr || !order) throw new Error('Order not found');
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new Error(`Order cannot be cancelled in its current state: ${order.status}`);
  }

  // 2. Update status to CANCELLED
  const { error: updateErr } = await supabase
    .from('online_orders')
    .update({ status: 'CANCELLED' })
    .eq('id', orderId);
    
  if (updateErr) throw updateErr;

  // 3. Restore inventory
  for (const item of order.online_order_items) {
    const { data: prod } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
    if (prod) {
      await supabase.from('products').update({ quantity: prod.quantity + item.quantity }).eq('id', item.product_id);
      await supabase.from('inventory').insert({
        product_id: item.product_id,
        change: item.quantity,
        reason: 'RESTOCK', // Cancelled order restoration
      });
    }
  }
}


// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function getReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*, e_customer(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    productId: r.product_id,
    customerId: r.e_customer_id,
    customerName: (r.e_customer as any)?.name || 'Anonymous',
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at
  })) as Review[];
}

export async function addReview(productId: string, storefrontUserId: string, rating: number, comment: string) {
  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    e_customer_id: storefrontUserId,
    rating,
    comment,
  });
  if (error) throw error;
}

// ─── Persistent Cart ─────────────────────────────────────────────────────────

export async function syncCartToDB(userId: string, items: CartItem[]) {
  try {
    const { error } = await supabase
      .from('e_cart')
      .upsert({ e_customer_id: userId, items, updated_at: new Date().toISOString() }, { onConflict: 'e_customer_id' });
    if (error) {
      console.error('Cart sync database error:', error.message, error.details);
    }
  } catch (err) {
    console.error('Cart sync unexpected error:', err);
  }
}

export async function getPersistentCart(userId: string) {
  const { data, error } = await supabase
    .from('e_cart')
    .select('items')
    .eq('e_customer_id', userId)
    .maybeSingle();
  if (error || !data) return [];
  return data.items;
}

export async function clearPersistentCart(userId: string) {
  await supabase.from('e_cart').delete().eq('e_customer_id', userId);
}
