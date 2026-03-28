'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { getProducts } from '@/lib/db';
import { Product } from '@/lib/types';
import { useCartStore, useToastStore, useSettingsStore } from '@/lib/store';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShoppingCart, ArrowLeft, Package, Tag, AlertTriangle,
  CheckCircle2, Minus, Plus, Star, Truck, ShieldCheck, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// ── Colour palette for product placeholder ─────────────────────────
const PALETTE = [
  'from-violet-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];
function getColor(id: string) {
  const idx = id.charCodeAt(0) % PALETTE.length;
  return PALETTE[idx];
}

// ── Trust badges ───────────────────────────────────────────────────
const BADGES = [
  { icon: Truck, label: 'Fast Delivery', sub: '2–7 business days' },
  { icon: ShieldCheck, label: 'Secure Checkout', sub: 'End-to-end encrypted' },
  { icon: RotateCcw, label: 'Easy Returns', sub: 'See our refund policy' },
];

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const cart = useCartStore();
  const { addToast, toasts } = useToastStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getProducts();
      const found = all.find(p => p.id === id);
      if (!found) { router.push('/products'); return; }
      setProduct(found);
      setRelated(all.filter(p => p.category === found.category && p.id !== id).slice(0, 4));
    } catch {
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleAddToCart = () => {
    if (!product || product.quantity <= 0) return;
    for (let i = 0; i < qty; i++) cart.addItem(product);
    addToast(`${qty}× ${product.name} added to cart`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleRelatedAdd = (p: Product) => {
    if (p.quantity <= 0) { addToast('Out of stock', 'error'); return; }
    cart.addItem(p);
    addToast(`Added ${p.name} to cart`, 'success');
  };

  if (loading) return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar onCartToggle={() => setIsCartOpen(true)} />
      <div className="max-w-5xl mx-auto w-full px-4 py-10 grid md:grid-cols-2 gap-10">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );

  if (!product) return null;

  const outOfStock = product.quantity <= 0;
  const lowStock = !outOfStock && product.quantity <= 5;
  const gradient = getColor(product.id);
  const maxQty = Math.min(product.quantity, 10);

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar onCartToggle={() => setIsCartOpen(true)} />

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors font-bold">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors font-bold">Products</Link>
          <span>/</span>
          <span className="text-foreground font-black truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Left: Product Visual ─────────────────────────────── */}
          <div className="space-y-4">
            {/* Hero image placeholder */}
            <div className={`relative aspect-square rounded-[2.5rem] bg-linear-to-br ${gradient} flex items-center justify-center overflow-hidden shadow-2xl`}>
              {/* Decorative circles */}
              <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
              
              {product.imageUrl ? (
                <Image 
                  src={product.imageUrl} 
                  alt={product.name} 
                  fill
                  className="absolute inset-0 w-full h-full object-cover z-0" 
                />
              ) : (
                <span className="text-[8rem] font-black text-white/30 select-none z-10 leading-none">
                  {product.name.charAt(0)}
                </span>
              )}

              {outOfStock && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-md flex items-center justify-center rounded-[2.5rem] z-20">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
                    <p className="font-black text-xl text-destructive">Out of Stock</p>
                    <p className="text-sm text-muted-foreground mt-1">Check back soon</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {BADGES.map(b => (
                <div key={b.label} className="flex flex-col items-center text-center p-3 rounded-2xl bg-card border border-border/50">
                  <b.icon className="h-5 w-5 text-primary mb-1.5" />
                  <p className="text-[10px] font-black text-foreground leading-tight">{b.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Details ───────────────────────────────────── */}
          <div className="flex flex-col">
            {/* Category pill */}
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full">
                <Tag className="h-3 w-3" />{product.category}
              </span>
              {!outOfStock && (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-success uppercase tracking-widest bg-success/10 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />In Stock
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-foreground mb-4">
              {product.name}
            </h1>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-bold">4.0 (demo)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-5xl font-black text-foreground">{useSettingsStore.getState().currencySymbol}{product.price.toFixed(2)}</span>
            </div>

            {/* Stock info */}
            <div className={`flex items-center gap-2 text-sm font-bold mb-6 px-4 py-3 rounded-2xl ${
              outOfStock ? 'bg-destructive/10 text-destructive border border-destructive/20' :
              lowStock   ? 'bg-warning/10 text-warning border border-warning/20' :
                           'bg-success/10 text-success border border-success/20'
            }`}>
              <Package className="h-4 w-4 shrink-0" />
              {outOfStock ? 'This item is currently out of stock'
                : lowStock ? `Hurry! Only ${product.quantity} remaining`
                : `${product.quantity} units available`}
            </div>

            {/* Qty selector */}
            {!outOfStock && (
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Quantity</span>
                <div className="flex items-center gap-2 bg-muted/30 rounded-2xl p-1.5">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-all active:scale-95 shadow-sm"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-black text-lg">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                    className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground font-bold">
                  = <span className="text-foreground font-black">{useSettingsStore.getState().currencySymbol}{(product.price * qty).toFixed(2)}</span>
                </span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] ${
                added
                  ? 'bg-success text-white shadow-success/30'
                  : outOfStock
                  ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 hover:shadow-xl hover:shadow-primary/40'
              }`}
            >
              {added ? (
                <><CheckCircle2 className="h-5 w-5" /> Added to Cart!</>
              ) : (
                <><ShoppingCart className="h-5 w-5" /> {outOfStock ? 'Out of Stock' : `Add ${qty > 1 ? `${qty}×` : ''} to Cart`}</>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-bold transition-colors mx-auto"
            >
              <ArrowLeft className="h-4 w-4" /> Back to products
            </button>
          </div>
        </div>

        {/* ── Related Products ──────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-black mb-6 tracking-tight">More in <span className="text-primary">{product.category}</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map(p => {
                const oos = p.quantity <= 0;
                const g = getColor(p.id);
                return (
                  <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden group hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col">
                    <Link href={`/products/${p.id}`} className="block">
                      <div className={`aspect-square bg-linear-to-br ${g} flex items-center justify-center text-4xl font-black text-white/20 relative overflow-hidden`}>
                        {p.imageUrl ? (
                          <Image 
                            src={p.imageUrl} 
                            alt={p.name} 
                            fill
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        ) : (
                          p.name.charAt(0)
                        )}
                        {oos && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
                            <span className="text-[10px] font-black text-muted-foreground border border-border bg-card px-2 py-0.5 rounded uppercase">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-[9px] font-black text-primary uppercase tracking-wider mb-0.5">{p.category}</p>
                      <Link href={`/products/${p.id}`}>
                        <h3 className="text-xs font-bold text-foreground line-clamp-2 flex-1 mb-2 hover:text-primary transition-colors">{p.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border gap-1">
                        <span className="text-base font-black">{useSettingsStore.getState().currencySymbol}{p.price.toFixed(2)}</span>
                        <button
                          onClick={() => handleRelatedAdd(p)}
                          disabled={oos}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary/20"
                        >
                          <Plus className="h-3 w-3" />
                          <ShoppingCart className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 border animate-in slide-in-from-right-full ${
            t.type === 'success' ? 'bg-green-600/90 backdrop-blur-md text-white border-green-500/50' :
            t.type === 'error'   ? 'bg-red-600/90 backdrop-blur-md text-white border-red-500/50' :
                                   'bg-card/90 backdrop-blur-md text-foreground border-border'
          }`}>
            {t.message}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  return <ProductDetailContent />;
}
