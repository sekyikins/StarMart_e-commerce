import { create } from 'zustand';
import { CartItem, Product, StoreSettings } from './types';
import { getStoreSettings } from './db';

const CURRENCY_MAP: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'GHS': '₵',
  'NGN': '₦',
  'KES': 'KSh',
  'INR': '₹',
  'JPY': '¥',
  'ZAR': 'R',
};

interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (product: Product, quantity?: number, userId?: string) => void;
  removeItem: (productId: string, userId?: string) => void;
  updateQuantity: (productId: string, quantity: number, userId?: string) => void;
  clearCart: (userId?: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

import { syncCartToDB } from './db';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (product, quantity = 1, userId) => {
    set((state) => {
      const existing = state.items.find(i => i.productId === product.id);
      let newItems;
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.quantity);
        newItems = state.items.map(i => i.productId === product.id ? {
          ...i,
          quantity: newQty,
          subtotal: newQty * i.price
        } : i);
      } else {
        newItems = [...state.items, {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: Math.min(quantity, product.quantity),
          subtotal: Math.min(quantity, product.quantity) * product.price,
          maxQuantity: product.quantity,
          image_url: product.image_url
        }];
      }
      if (userId) syncCartToDB(userId, newItems);
      return { items: newItems };
    });
  },
  removeItem: (productId, userId) => {
    set((state) => {
       const newItems = state.items.filter(i => i.productId !== productId);
       if (userId) syncCartToDB(userId, newItems);
       return { items: newItems };
    });
  },
  updateQuantity: (productId, quantity, userId) => {
    set((state) => {
      const newItems = state.items.map(i => {
        if (i.productId === productId) {
          const newQty = Math.max(1, Math.min(quantity, i.maxQuantity));
          return { ...i, quantity: newQty, subtotal: newQty * i.price };
        }
        return i;
      });
      if (userId) syncCartToDB(userId, newItems);
      return { items: newItems };
    });
  },
  clearCart: (userId) => {
    set({ items: [] });
    if (userId) syncCartToDB(userId, []);
  },
  getTotal: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

interface SettingsState {
  storeName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  isInitialized: boolean;
  setSettings: (settings: StoreSettings) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  storeName: 'StarMart',
  currency: 'USD',
  currencySymbol: '$',
  taxRate: 0,
  isInitialized: false,
  setSettings: (s) => set({ 
    storeName: s.storeName, 
    currency: s.currency, 
    currencySymbol: CURRENCY_MAP[s.currency] || s.currency,
    taxRate: s.taxRate,
    isInitialized: true 
  }),
  fetchSettings: async () => {
    try {
      const s = await getStoreSettings();
      set({ 
        storeName: s.storeName, 
        currency: s.currency, 
        currencySymbol: CURRENCY_MAP[s.currency] || s.currency,
        taxRate: s.taxRate,
        isInitialized: true 
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }
}));

