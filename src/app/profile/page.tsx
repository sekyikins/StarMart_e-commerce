'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Phone, Star, ShoppingBag, 
  Settings, MapPin, 
  ChevronRight, Clock, FileText,
  HelpCircle, ShieldCheck, LogOut
} from 'lucide-react';
import { getOrdersByUser } from '@/lib/db';
import { Order } from '@/lib/types';
import Link from 'next/link';

function LoyaltyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-3xl bg-yellow-400 flex items-center justify-center shadow-xl shadow-yellow-400/20">
            <Star className="h-10 w-10 text-indigo-900 fill-indigo-900" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center mb-2">StarMart Loyalty</h2>
        <p className="text-center text-muted-foreground mb-8 text-sm px-4">Your loyalty is recognized! Use your points for exclusive discounts and free deliveries on future orders.</p>
        
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-muted/50 border border-border flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">1</div>
            <div>
              <h4 className="font-bold text-sm">Welcome Gift</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Get 100 free points instantly when you create your StarMart account.</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-muted/50 border border-border flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black">2</div>
            <div>
              <h4 className="font-bold text-sm">Daily Purchase Bonus</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Earn 50 points for every day you make a purchase, regardless of the order size.</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-muted/50 border border-border flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">3</div>
            <div>
              <h4 className="font-bold text-sm">Exclusive Promos</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Participate in monthly challenges to multiply your earnings and unlock higher tiers.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 h-12 rounded-2xl bg-primary text-white font-bold hover:scale-[1.02] transition-transform active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function ProfileContent() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      startTransition(() => {
        setLoadingOrders(true);
      });
      getOrdersByUser(user.id)
        .then(setOrders)
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 py-20 text-center">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <User className="h-12 w-12 text-muted-foreground"/>
        </div>
        <h2 className="text-2xl font-black mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-8">Please sign in to your StarMart account to view your profile and order history.</p>
        <Link 
          href="/login" 
          className="w-full flex items-center justify-center h-14 rounded-2xl bg-primary text-white font-bold hover:opacity-90 transition-all hover:scale-[1.02]"
        >
          Sign In to StarMart
        </Link>
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();
  const memberYear = user.created_at ? new Date(user.created_at).getFullYear() : 2024;

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      {showLoyaltyModal && <LoyaltyModal onClose={() => setShowLoyaltyModal(false)} />}
      
      {/* Hero Header */}
      <div className="relative bg-primary py-12 overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap items-end gap-6 text-white">
            <div className="h-32 w-32 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-5xl font-black shadow-2xl transition-transform hover:scale-105">
              {initial}
            </div>
            <div className="flex-1 mb-2">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-4xl font-black">{user.name}</h1>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold uppercase tracking-wider">
                  Member Since {memberYear}
                </span>
              </div>
              <p className="text-indigo-100 flex items-center gap-2">
                <Mail className="h-4 w-4 opacity-70" /> {user.email}
              </p>
            </div>
            <button 
              onClick={() => setShowLoyaltyModal(true)}
              className="bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/20 self-start md:self-auto hover:bg-white/20 transition-all group active:scale-95 shadow-xl"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="h-10 w-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20 group-hover:scale-110 transition-transform">
                  <Star className="h-6 w-6 text-indigo-900 fill-indigo-900" />
                </div>
                <div>
                  <div className="text-white/70 text-[10px] font-black uppercase tracking-tighter">Loyalty Points</div>
                  <div className="text-2xl font-black leading-none mt-0.5">{user.loyalty_points} <span className="text-sm font-normal text-white/60">Pts</span></div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-3">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block space-y-1.5">
              {[
                { icon: User, label: 'Dashboard', active: true },
                { icon: ShoppingBag, label: 'My Orders', href: '/orders' },
                { icon: Settings, label: 'Account Settings', href: '/settings' },
                { icon: ShieldCheck, label: 'Privacy Policy', href: '/privacy' },
                { icon: FileText, label: 'Terms & Conditions', href: '/terms' },
                { icon: HelpCircle, label: 'Help Center', href: '/faq' },
              ].map((item, idx) => (
                item.href ? (
                  <Link 
                    key={idx} 
                    href={item.href}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all hover:bg-card hover:translate-x-1 hover:shadow-xl hover:shadow-indigo-500/5 hover:border hover:border-border/50"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    {item.label}
                    <ChevronRight className="h-4 w-4 ml-auto opacity-30" />
                  </Link>
                ) : (
                  <button 
                    key={idx} 
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                      item.active 
                        ? 'bg-card border-2 border-primary shadow-2xl shadow-indigo-500/20 text-primary translate-x-1' 
                        : 'text-muted-foreground hover:bg-card hover:shadow-lg'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    {!item.active && <ChevronRight className="h-4 w-4 ml-auto opacity-30" />}
                  </button>
                )
              ))}
              
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all mt-4 group"
              >
                <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center transition-transform group-hover:scale-110">
                  <LogOut className="h-4 w-4" />
                </div>
                Sign Out
              </button>
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
               <div className="bg-card border border-border p-2 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none snap-x active:cursor-grabbing shadow-sm">
                  {[
                    { icon: User, label: 'Dashboard', active: true },
                    { icon: ShoppingBag, label: 'Orders', href: '/orders' },
                    { icon: Settings, label: 'Settings', href: '/settings' },
                    { icon: ShieldCheck, label: 'Privacy', href: '/privacy' },
                    { icon: FileText, label: 'Terms', href: '/terms' },
                    { 
                      icon: LogOut, 
                      label: 'Logout', 
                      onClick: () => setShowLogoutConfirm(true),
                      className: 'text-red-500' 
                    },
                  ].map((item, idx) => (
                    item.href ? (
                      <Link 
                        key={idx} 
                        href={item.href}
                        className="flex flex-col items-center justify-center min-w-[70px] aspect-square rounded-2xl text-[10px] font-bold text-muted-foreground hover:bg-muted snap-center"
                      >
                        <item.icon className="h-5 w-5 mb-1" />
                        {item.label}
                      </Link>
                    ) : (
                      <button 
                        key={idx} 
                        onClick={item.onClick}
                        className={`flex flex-col items-center justify-center min-w-[70px] aspect-square rounded-2xl text-[10px] font-bold snap-center ${item.active ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner' : item.className || 'text-muted-foreground hover:bg-muted'}`}
                      >
                        <item.icon className="h-5 w-5 mb-1" />
                        {item.label}
                      </button>
                    )
                  ))}
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card p-6 rounded-4xl border-2 border-border shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mb-4 ring-4 ring-blue-100 dark:ring-blue-900/40 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black">{orders.length}</div>
                <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Total Orders</div>
              </div>
              <div className="bg-card p-6 rounded-4xl border-2 border-border shadow-2xl shadow-orange-500/20 hover:shadow-orange-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center mb-4 ring-4 ring-orange-100 dark:ring-orange-900/40 group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black">{orders.filter(o => o.status === 'PENDING').length}</div>
                <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active Shipments</div>
              </div>
              <div className="bg-card p-6 rounded-4xl border-2 border-border shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-4 ring-4 ring-emerald-100 dark:ring-emerald-900/40 group-hover:scale-110 transition-transform">
                  <Star className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black">Silver</div>
                <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loyalty Tier</div>
              </div>
            </div>

            {/* Personal Details Card */}
            <div className="bg-card rounded-4xl border-2 border-border overflow-hidden shadow-2xl shadow-indigo-500/15 mb-8">
              <div className="px-8 py-6 border-b-2 border-border flex items-center justify-between bg-muted/30 backdrop-blur-sm">
                <h3 className="font-black text-xl">Personal Information</h3>
                <Link href="/settings" className="px-4 h-9 flex items-center rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all gap-1">
                  Manage Settings <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Full Name</label>
                  <div className="text-foreground font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary opacity-50" /> {user.name}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Email Address</label>
                  <div className="text-foreground font-bold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary opacity-50" /> {user.email}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Mobile Phone</label>
                  <div className="text-foreground font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary opacity-50" /> {user.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Preferred Address</label>
                  <div className="text-foreground font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary opacity-50" /> Default Address
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl px-2">Recent Orders</h3>
                <Link href="/orders" className="text-sm font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                  See Full History <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {loadingOrders ? (
                <div className="bg-card rounded-4xl p-12 text-center border-2 border-border border-dashed shadow-inner">
                  <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm font-black uppercase tracking-widest">Updating Ledger...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="bg-card rounded-4xl border-2 border-border divide-y-2 divide-border overflow-hidden shadow-2xl shadow-indigo-500/15">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="p-6 flex items-center justify-between hover:bg-muted/40 transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          <ShoppingBag className="h-7 w-7 text-muted-foreground/80" />
                        </div>
                        <div>
                          <div className="font-black text-base">Order #{order.id.slice(0, 8).toUpperCase()}</div>
                          <div className="text-[11px] font-black text-muted-foreground uppercase opacity-70 tracking-tight">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden md:block">
                          <div className="font-black text-2xl tracking-tighter">${order.totalAmount.toFixed(2)}</div>
                          <div className="text-[10px] text-primary font-black uppercase tracking-widest">{order.items.length} items purchased</div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border-2 ${
                          order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10' :
                          order.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100 shadow-orange-500/10' :
                          'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-500/10'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-4xl p-16 text-center border-2 border-border border-dashed shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-150" />
                  <div className="h-20 w-20 rounded-3xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:rotate-12 transition-transform">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h4 className="font-black text-2xl mb-2">No active orders</h4>
                  <p className="text-muted-foreground text-sm mb-8 max-w-[280px] mx-auto font-medium">Your current shopping bag is empty. Explore our latest collections to get started!</p>
                  <Link href="/products" className="inline-flex h-14 px-10 rounded-2xl bg-primary text-white text-sm font-black items-center shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] transition-all active:scale-95">Explore Storefront</Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-card border-2 border-border/80 w-full max-w-sm rounded-4xl p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <LogOut className="h-8 w-8" />
              </div>
            </div>
            <h4 className="text-2xl font-black text-center mb-2">Sign Out</h4>
            <p className="text-center text-muted-foreground mb-8 font-medium">Are you sure you want to sign out of your StarMart account?</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="h-12 rounded-xl bg-muted font-bold hover:bg-muted/80 transition-colors"
              >
                No, Stay
              </button>
              <button 
                onClick={() => { logout(); router.push('/'); }}
                className="h-12 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Navbar 
        onCartToggle={() => setIsCartOpen(true)} 
        showSearch={false}
      />
      <ProfileContent />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
    </main>
  );
}
