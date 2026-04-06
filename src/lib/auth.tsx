'use client';

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore, startTransition } from 'react';
import { getStorefrontUserByEmail, getStorefrontUserById, getPersistentCart, deleteStorefrontAccount } from './db';
import { useCartStore } from './store';
import bcrypt from 'bcryptjs';

import { StorefrontUser } from './types';

interface AuthContextType {
  user: StorefrontUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: (u: StorefrontUser) => void;
  isLoading: boolean;
  syncCart: (userId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, login: async () => false, logout: () => {}, refreshUser: () => {}, isLoading: true, syncCart: async () => {}, deleteAccount: async () => {},
});

// Modern React pattern to track hydration without triggering cascading renders
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<StorefrontUser | null>(null);
  
  // Track hydration state using the same modern pattern as ThemeToggle
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const syncCart = async (userId: string) => {
    const items = await getPersistentCart(userId);
    if (items && items.length > 0) {
      useCartStore.getState().setItems(items);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ec_user');
    useCartStore.getState().setItems([]);
  };

  useEffect(() => {
    if (!isMounted) return;

    const stored = localStorage.getItem('ec_user');
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        
        // Verify with database that the user hasn't been deleted/reset
        getStorefrontUserById(parsed.id).then((dbUser) => {
           if (!dbUser) {
             logout();
             return;
           }
           
           startTransition(() => {
             setUser(parsed);
           });
           
           getPersistentCart(parsed.id).then(items => {
             if (items && items.length > 0) {
               useCartStore.getState().setItems(items);
             }
           });
        }).catch(() => {
           logout();
        });
        
      } catch { 
        localStorage.removeItem('ec_user'); 
      }
    }
  }, [isMounted]);

  // Derive loading state from hydration status
  const isLoading = !isMounted;

  const login = async (email: string, password: string): Promise<boolean> => {
    const dbUser = await getStorefrontUserByEmail(email);
    if (!dbUser) return false;
    const valid = await bcrypt.compare(password, dbUser.password_hash);
    if (!valid) return false;
    const u: StorefrontUser = {
      id: dbUser.id, name: dbUser.name, email: dbUser.email,
      phone: dbUser.phone ?? undefined, loyalty_points: dbUser.loyalty_points, created_at: dbUser.created_at,
    };
    setUser(u);
    localStorage.setItem('ec_user', JSON.stringify(u));
    await syncCart(u.id);
    return true;
  };

  const refreshUser = (u: StorefrontUser) => {
    setUser(u);
    localStorage.setItem('ec_user', JSON.stringify(u));
  };

  const deleteAccount = async () => {
    if (user) {
      await deleteStorefrontAccount(user.id);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading, syncCart, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
