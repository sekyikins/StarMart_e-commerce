'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useRouter } from 'next/navigation';
import { updateStorefrontUser } from '@/lib/db';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { 
  User, Mail, Phone, ChevronRight, 
  Trash2, LogOut, Shield, CreditCard,
  CheckCircle2, AlertTriangle, Settings
} from 'lucide-react';
import { useToastStore } from '@/lib/store';

function SettingsContent() {
  const { user, logout, deleteAccount, refreshUser } = useAuth();
  const router = useRouter();
  const { addToast } = useToastStore();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStorefrontUser(user.id, { name, phone: phone || undefined });
      refreshUser({ ...user, name, phone: phone || undefined });
      addToast('Profile updated successfully', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      addToast('Account deleted successfully', 'success');
      router.push('/');
    } catch {
      addToast('Failed to delete account', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Account Settings
        </h1>
        <p className="text-muted-foreground font-medium">Manage your personal information, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation / Sections */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border-2 border-primary shadow-xl shadow-indigo-500/10 text-primary font-black transition-all">
            <User className="h-5 w-5" />
            Personal Info
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground font-bold hover:bg-card transition-all">
            <Shield className="h-5 w-5" />
            Security & Login
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground font-bold hover:bg-card transition-all">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </button>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Profile Section */}
          <div className="bg-card rounded-4xl border-2 border-border p-8 shadow-2xl shadow-indigo-500/15 mb-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Public Profile
            </h3>
            
            <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-muted/30 border border-border rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Email Address (Read Only)</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="email" 
                    value={user.email}
                    readOnly
                    className="w-full h-12 pl-12 pr-4 bg-muted border border-border rounded-2xl outline-none font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-muted/30 border border-border rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="h-12 w-full mt-2 bg-primary text-white rounded-2xl font-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Save Changes
              </button>
            </form>
          </div>

          {/* Preferences Section */}
          <div className="bg-card rounded-4xl border-2 border-border p-8 shadow-2xl shadow-indigo-500/15 mb-8">
            <h3 className="text-xl font-black mb-6">Preferences</h3>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">Dark Mode</div>
                  <div className="text-xs text-muted-foreground">Adjust the look and feel</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Danger Zone Section */}
          <div className="bg-red-500/5 rounded-4xl border-2 border-red-500/20 p-8 shadow-xl shadow-red-500/5">
            <h3 className="text-xl font-black text-red-500 mb-6 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-card border border-border hover:border-red-500/30 group transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center transition-transform group-hover:scale-110">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">Sign Out</div>
                    <div className="text-xs text-muted-foreground">Log out of this session</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-30 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-red-500/5 border border-red-500/10 hover:border-red-500/50 group transition-all"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-red-600">Delete Account</div>
                    <div className="text-xs text-red-600/60 font-medium">Permanently remove your data</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-red-600 opacity-30 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-card border border-border w-full max-w-sm rounded-4xl p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <LogOut className="h-8 w-8" />
              </div>
            </div>
            <h4 className="text-2xl font-black text-center mb-2">Confirm Logout</h4>
            <p className="text-center text-muted-foreground mb-8 font-medium">Are you sure you want to sign out of your account?</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="h-12 rounded-xl bg-muted font-bold hover:bg-muted/80"
              >
                Cancel
              </button>
              <button 
                onClick={() => { logout(); router.push('/'); }}
                className="h-12 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-card border-2 border-red-500/20 w-full max-w-sm rounded-4xl p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Trash2 className="h-8 w-8" />
              </div>
            </div>
            <h4 className="text-2xl font-black text-center mb-2 text-red-600">Delete Account?</h4>
            <p className="text-center text-muted-foreground mb-8 font-medium">This action is permanent and cannot be undone. All your orders and data will be removed.</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="h-12 rounded-xl bg-muted font-bold hover:bg-muted/80"
              >
                Keep Account
              </button>
              <button 
                onClick={handleDelete}
                className="h-12 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-xl shadow-red-600/20"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar 
        onCartToggle={() => setIsCartOpen(true)} 
        showSearch={false}
      />
      <SettingsContent />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
    </main>
  );
}
