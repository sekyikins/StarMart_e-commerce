'use client';
import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AuthProvider } from '@/lib/auth';
import { ChevronDown, HelpCircle, ShieldCheck, Mail } from 'lucide-react';

function FAQContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const toggleItem = (i: number) => {
    setOpenItems(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const faqs = [
    {
      q: "Can I cancel my order?",
      a: "Yes! You can cancel any order that is still in &apos;Pending&apos; or &apos;Confirmed&apos; status. Once an order is marked as &apos;In Transit&apos;, it cannot be cancelled as it&apos;s already on its way to you."
    },
    {
      q: "How do I request a refund?",
      a: "Refunds can be requested within 7 days of delivery for damaged or incorrect items. Please contact our support team with your order ID and photos of the items. Once approved, refunds are processed back to your original payment method within 3-5 business days."
    },
    {
      q: "Where do you deliver?",
      a: "We currently deliver to all major regions. You can select a predefined delivery point during checkout or enter a custom address for home delivery."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept Credit/Debit Cards, Mobile Money, and Cash on Delivery. All transactions are secured and encrypted."
    }
  ];

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar onCartToggle={() => setIsCartOpen(true)} />
      
      <div className="max-w-4xl mx-auto w-full px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <HelpCircle className="h-3 w-3" />
            Support Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Refund Policy & FAQs</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to know about our services, orders, and policies.</p>
        </div>

        <div className="grid gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden transition-all">
              <button 
                onClick={() => toggleItem(i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-bold text-lg pr-8">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${openItems.includes(i) ? 'rotate-180' : ''}`} />
              </button>
              {openItems.includes(i) && (
                <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-6">
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 flex flex-col gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Our Guarantee</h3>
              <p className="text-muted-foreground text-sm">We ensure all products meet our high quality standards. If you&apos;re not satisfied, we&apos;re here to help make it right.</p>
            </div>
          </div>
          <div className="bg-muted/40 border border-border rounded-3xl p-8 flex flex-col gap-4">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Need more help?</h3>
              <p className="text-muted-foreground text-sm">Can&apos;t find what you&apos;re looking for? Reach out to our 24/7 support team at support@starmart.com</p>
            </div>
          </div>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
    </main>
  );
}

export default function FAQPage() {
  return <AuthProvider><FAQContent /></AuthProvider>;
}
