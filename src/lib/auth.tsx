'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorefrontUserByEmail, getPersistentCart } from './db';
import { useCartStore } from './store';
import bcrypt from 'bcryptjs';

interface StorefrontUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loyalty_points: number;
}

interface AuthContextType {
  user: StorefrontUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: (u: StorefrontUser) => void;
  isLoading: boolean;
  syncCart: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, login: async () => false, logout: () => {}, refreshUser: () => {}, isLoading: true, syncCart: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<StorefrontUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ec_user');
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Also sync cart on initial load if logged in
        getPersistentCart(parsed.id).then(items => {
          if (items && items.length > 0) {
            useCartStore.getState().setItems(items);
          }
        });
      } catch { 
        localStorage.removeItem('ec_user'); 
      }
    }
    setIsLoading(false);
  }, []);

  const syncCart = async (userId: string) => {
    const items = await getPersistentCart(userId);
    if (items && items.length > 0) {
      useCartStore.getState().setItems(items);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const dbUser = await getStorefrontUserByEmail(email);
    if (!dbUser) return false;
    const valid = await bcrypt.compare(password, dbUser.password_hash);
    if (!valid) return false;
    const u: StorefrontUser = {
      id: dbUser.id, name: dbUser.name, email: dbUser.email,
      phone: dbUser.phone ?? undefined, loyalty_points: dbUser.loyalty_points,
    };
    setUser(u);
    localStorage.setItem('ec_user', JSON.stringify(u));
    await syncCart(u.id);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ec_user');
    useCartStore.getState().setItems([]);
  };

  const refreshUser = (u: StorefrontUser) => {
    setUser(u);
    localStorage.setItem('ec_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading, syncCart }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
