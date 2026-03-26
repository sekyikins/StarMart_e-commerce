'use client';
import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AuthProvider } from '@/lib/auth';
import { Shield, Clock, FileText, Lock } from 'lucide-react';

function TermsContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar onCartToggle={() => setIsCartOpen(true)} />
      
      <div className="max-w-4xl mx-auto w-full px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            <Shield className="h-3 w-3" />
            Terms of Service
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Terms and Conditions</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Updated March 25, 2026. Please read our terms carefully before using our services.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-12">
            <section className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                   <Clock className="h-4 w-4" />
                 </div>
                 <h2 className="text-xl font-bold uppercase tracking-tight">Order Cancellation</h2>
               </div>
               <p className="text-muted-foreground leading-relaxed">
                  Customers can cancel any order that is in &apos;Pending&apos; or &apos;Confirmed&apos; status. Once an order is processed for delivery and marked as &apos;In Transit&apos;, cancellation is no longer possible. 
               </p>
               <p className="text-muted-foreground leading-relaxed">
                  Upon successful cancellation, full refunds will be issued to the original payment method within 3-5 business days. Order items will be returned to the store&apos;s inventory.
               </p>
            </section>

            <section className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                   <FileText className="h-4 w-4" />
                 </div>
                 <h2 className="text-xl font-bold uppercase tracking-tight">Usage Rules</h2>
               </div>
               <p className="text-muted-foreground leading-relaxed">
                  By using StarMart, you agree to provide accurate information regarding your identity and delivery location. We reserve the right to suspend accounts that engage in suspicious or fraudulent activities.
               </p>
            </section>
          </div>

          <div className="space-y-12">
            <section className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                   <Lock className="h-4 w-4" />
                 </div>
                 <h2 className="text-xl font-bold uppercase tracking-tight">Privacy Policy</h2>
               </div>
               <p className="text-muted-foreground leading-relaxed">
                  Your data security is our priority. We only store information necessary for processing your orders. We do not sell or share your personal information with third-party advertisers. All payment transactions are encrypted.
               </p>
            </section>

            <section className="space-y-4">
               <div className="flex items-center gap-3 border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-2xl">
                 <h2 className="text-lg font-black uppercase tracking-tight">Important Notice</h2>
               </div>
               <p className="text-muted-foreground leading-relaxed italics opacity-80">
                  StarMart reserves the right to modify these terms at any time. Continued use of the platform after updates constitutes acceptance of the revised terms.
               </p>
            </section>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-border flex flex-col items-center gap-6 text-center">
           <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground transform rotate-12">
             <Shield className="h-8 w-8" />
           </div>
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">&copy; 2026 StarMart. Safe, Reliable, Exceptional Service.</p>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
    </main>
  );
}

export default function TermsPage() {
  return <AuthProvider><TermsContent /></AuthProvider>;
}
