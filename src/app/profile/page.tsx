'use client';
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Star, ShoppingBag, LogOut } from 'lucide-react';
import Link from 'next/link';

function ProfileContent() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <User className="h-16 w-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700"/>
        <h2 className="text-xl font-bold mb-2">You&apos;re not signed in</h2>
        <p className="text-zinc-500 text-sm mb-6">Sign in to view your profile and orders</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all hover:scale-[1.02]">Sign In</Link>
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Profile Card */}
      <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-black">{initial}</div>
            <div>
              <h1 className="text-2xl font-black">{user.name}</h1>
              <p className="text-indigo-200 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
            <Star className="h-4 w-4 text-yellow-300 fill-yellow-300"/>
            <span className="font-bold text-sm">{user.loyalty_points} Loyalty Points</span>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-zinc-400 shrink-0"/>
            <span className="text-[var(--foreground)]/70">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-zinc-400 shrink-0"/>
              <span className="text-[var(--foreground)]/70">{user.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link href="/orders" className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 flex flex-col items-center gap-2 hover:border-indigo-400 transition-colors">
          <ShoppingBag className="h-8 w-8 text-indigo-600"/>
          <span className="font-bold text-sm">My Orders</span>
          <span className="text-xs text-[var(--muted-foreground)]">View history</span>
        </Link>
        <Link href="/products" className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 flex flex-col items-center gap-2 hover:border-indigo-400 transition-colors">
          <Star className="h-8 w-8 text-indigo-600"/>
          <span className="font-bold text-sm">Browse</span>
          <span className="text-xs text-[var(--muted-foreground)]">Discover products</span>
        </Link>
      </div>

      <button
        onClick={() => { logout(); router.push('/'); }}
        className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-red-200 dark:border-red-900 text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
      >
        <LogOut className="h-5 w-5"/>Sign Out
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  return (
    <AuthProvider>
      <main className="min-h-screen flex flex-col bg-[var(--background)]">
        <ProfileContent />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
      </main>
    </AuthProvider>
  );
}
