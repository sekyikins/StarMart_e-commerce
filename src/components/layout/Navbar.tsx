'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useCartStore, useSettingsStore } from '@/lib/store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ShoppingBag, User, Menu, X, Package } from 'lucide-react';

interface NavbarProps {
  onCartToggle: () => void;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  showSearch?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onCartToggle,
  searchQuery = '',
  onSearchChange,
  showSearch = true,
}) => {
  const { user } = useAuth();
  const itemCount = useCartStore(s => s.getItemCount());
  const { storeName } = useSettingsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b-2 border-border/80 bg-background/90 backdrop-blur-xl shadow-2xl shadow-indigo-500/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow shadow-indigo-500/30">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">{storeName}</span>
          </Link>

          {/* Search */}
          {showSearch && (
            <div className="flex-1 max-w-2xl hidden sm:block">
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={e => onSearchChange?.(e.target.value)}
                className="w-full h-10 px-4 rounded-full bg-(--muted) border border-(--border) text-(--foreground) placeholder:text-(--muted-foreground) focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
              />
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                href="/products"
                className="px-3 py-1.5 text-sm font-medium text-(--muted-foreground) hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-(--muted)"
              >
                Products
              </Link>

              {user ? (
                <>
                  <Link
                    href="/orders"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-(--muted-foreground) hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-(--muted)"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-(--muted-foreground) hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-(--muted)"
                  >
                    <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    {user.name.split(' ')[0]}
                  </Link>

                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-(--muted-foreground) hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-(--muted)"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Link>
              )}
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Cart button */}
            <button
              onClick={onCartToggle}
              className="relative flex items-center gap-2 h-10 px-4 rounded-full bg-(--foreground) text-(--background) text-sm hover:cursor-pointer font-bold transition-all hover:opacity-85 active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:block">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold border-2 border-(--background) flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="sm:hidden p-2 rounded-lg text-(--muted-foreground) hover:bg-(--muted) transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {showSearch && (
          <div className="sm:hidden pb-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => onSearchChange?.(e.target.value)}
              className="w-full h-10 px-4 rounded-full bg-(--muted) border border-(--border) text-(--foreground) placeholder:text-(--muted-foreground) outline-none text-sm focus:border-indigo-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-(--border) bg-(--card) px-4 py-3 space-y-1">
          <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">Products</Link>
          {user ? (
            <>
              <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">My Orders</Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">Profile</Link>

            </>
          ) : (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-(--muted) transition-colors">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
};
