'use client';

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore, startTransition } from 'react';
import { getStorefrontUserByEmail, getStorefrontUserById, deleteStorefrontAccount } from './db';
import { useCartStore } from './store';
import bcrypt from 'bcryptjs';

import { StorefrontUser, CartItem } from './types';

interface AuthContextType {
  user: StorefrontUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: (u: StorefrontUser) => void;
  isLoading: boolean;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, login: async () => false, logout: () => {}, refreshUser: () => {}, isLoading: true, deleteAccount: async () => {},
});

// Modern React pattern to track hydration without triggering cascading renders
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<StorefrontUser | null>(null);
  
  // Track hydration state using the same modern pattern as ThemeToggle
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ec_user');
    const savedCart = localStorage.getItem(`ec-cart-guest`);
    if (savedCart) {
      try {
        useCartStore.getState().setItems(JSON.parse(savedCart));
      } catch {}
    } else {
      useCartStore.getState().setItems([]);
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const stored = localStorage.getItem('ec_user');
    let userId = 'guest';

    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        userId = parsed.id;
        
        // Verify with database that the user hasn't been deleted/reset
        getStorefrontUserById(parsed.id).then((dbUser) => {
           if (!dbUser) {
             logout();
             return;
           }
           
           startTransition(() => {
             setUser(parsed);
           });
        }).catch(() => {
           logout();
        });
        
      } catch { 
        localStorage.removeItem('ec_user'); 
        userId = 'guest';
      }
    }

    const savedCart = localStorage.getItem(`ec-cart-${userId}`);
    if (savedCart) {
      try {
        useCartStore.getState().setItems(JSON.parse(savedCart));
      } catch {}
    } else {
      useCartStore.getState().setItems([]);
    }
  }, [isMounted]);

  // Derive loading state from hydration status
  const isLoading = !isMounted;

  const login = async (email: string, password: string): Promise<boolean> => {
    const dbUser = await getStorefrontUserByEmail(email);
    if (!dbUser || !dbUser.password_hash) return false;
    const valid = await bcrypt.compare(password, dbUser.password_hash);
    if (!valid) return false;
    const u: StorefrontUser = {
      id: dbUser.id, 
      name: dbUser.name, 
      email: dbUser.email,
      phone: dbUser.phone ?? undefined, 
      loyalty_points: dbUser.loyalty_points, 
      type: dbUser.type,
      created_at: dbUser.created_at,
    };
    setUser(u);
    localStorage.setItem('ec_user', JSON.stringify(u));

    const guestCart = useCartStore.getState().items;
    const mergedCart = [...guestCart.map(item => ({ ...item }))]; // clone guest items

    const savedCartStr = localStorage.getItem(`ec-cart-${u.id}`);
    if (savedCartStr) {
      try {
        const savedCart = JSON.parse(savedCartStr);
        // Merge saved cart into guest cart
        savedCart.forEach((savedItem: CartItem) => {
          const existing = mergedCart.find(i => i.productId === savedItem.productId);
          if (existing) {
            existing.quantity = Math.min(existing.quantity + savedItem.quantity, existing.maxQuantity);
            existing.subtotal = existing.quantity * existing.price;
          } else {
            mergedCart.push(savedItem);
          }
        });
      } catch {}
    }

    useCartStore.getState().setItems(mergedCart);
    localStorage.removeItem('ec-cart-guest');

    return true;
  };

  const refreshUser = (u: StorefrontUser) => {
    setUser(u);
    localStorage.setItem('ec_user', JSON.stringify(u));
    localStorage.setItem(`ec-cart-${u.id}`, JSON.stringify(useCartStore.getState().items));
    localStorage.removeItem('ec-cart-guest');
  };

  const deleteAccount = async () => {
    if (user) {
      await deleteStorefrontAccount(user.id);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
