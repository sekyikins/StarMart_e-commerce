'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ShieldCheck, Mail, Lock, Eye, ArrowLeft, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/store';

function PrivacyContent() {
  const { storeName } = useSettingsStore();
  const contactEmail = `privacy@${storeName.toLowerCase().replace(/\s+/g, '')}.com`;
  return (
    <div className="max-w-4xl mx-auto w-full px-6 pt-6 md:pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Breadcrumb */}
      <Link 
        href="/profile" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Profile
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground font-medium">Last updated: March 2026</p>
        </div>
      </div>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
        
        <section className="bg-card rounded-3xl border border-border p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            1. Your Data Protection
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            At {storeName}, we take your privacy seriously. This policy describes how we collect, use, and handle your information when you use our storefront and administrative modules. Our systems are built with 256-bit AES encryption to ensure your data is always safe.
          </p>
        </section>

        <section className="space-y-6 px-4">
          <h2 className="text-2xl font-bold">2. Information We Collect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                   <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                   <h4 className="font-bold">Account Data</h4>
                   <p className="text-sm text-muted-foreground">Name, email address, phone number, and password hashes stored securely via bcrypt.</p>
                </div>
             </div>
             <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                   <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                   <h4 className="font-bold">Order History</h4>
                   <p className="text-sm text-muted-foreground">Records of your purchases, payment methods, delivery addresses, and cart items.</p>
                </div>
             </div>
          </div>
        </section>

        <section className="bg-muted/30 rounded-3xl p-8 border border-border/50">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            3. Transparency & Rights
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            You have the right to access, update, or delete your personal information at any time through your <Link href="/settings" className="text-primary font-bold hover:underline">Account Settings</Link>. When you delete your account, all associated data is permanently erased from our production databases.
          </p>
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-start gap-3">
             <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
             <p className="text-xs text-primary font-medium leading-relaxed">
                {storeName} follows GDPR and modern data protection standards to provide you with the highest level of control over your digital footprint.
             </p>
          </div>
        </section>

        <section className="text-center py-8">
           <h3 className="text-xl font-bold mb-2">Have questions about your privacy?</h3>
           <p className="text-muted-foreground mb-6">Our security team is ready to help you with any concerns.</p>
           <a 
             href={`mailto:${contactEmail}`} 
             className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-foreground hover:bg-foreground/90 hover:scale-105 text-background font-bold hover:opacity-90 transition-all active:scale-95"
           >
              <Mail className="h-5 w-5" />
              Contact Privacy Team
           </a>
        </section>

      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar 
        onCartToggle={() => setIsCartOpen(true)} 
        showSearch={false}
      />
      <PrivacyContent />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
    </main>
  );
}
