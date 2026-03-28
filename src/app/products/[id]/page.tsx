'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { getProducts, getReviews, addReview } from '@/lib/db';
import { Product, Review } from '@/lib/types';
import { useCartStore, useToastStore, useSettingsStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ShoppingCart, ArrowLeft, Package, Tag, AlertTriangle,
  CheckCircle2, Minus, Plus, Star, Truck, ShieldCheck, RotateCcw,
  MessageSquare, User, Send, Loader2
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [added, setAdded] = useState(false);
  
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const cart = useCartStore();
  const { addToast, toasts } = useToastStore();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, revs] = await Promise.all([getProducts(), getReviews(id)]);
      const found = all.find(p => p.id === id);
      if (!found) { router.push('/products'); return; }
      setProduct(found);
      setReviews(revs);
      setRelated(all.filter(p => (p.categoryId === found.categoryId || p.category === found.category) && p.id !== id).slice(0, 4));
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    if (reviewForm.comment.length < 3) {
      addToast('Please write a slightly longer review', 'error');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await addReview(product.id, user.id, reviewForm.rating, reviewForm.comment);
      addToast('Review submitted!', 'success');
      setReviewForm({ rating: 5, comment: '' });
      const revs = await getReviews(product.id);
      setReviews(revs);
    } catch {
      addToast('Failed to post review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
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
              
              {product.image_url ? (
                <Image 
                  src={product.image_url} 
                  alt={product.name} 
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 500px"
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

            {/* Rating Display */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => {
                  const avg = reviews.length > 0 
                    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
                    : 0;
                  return (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(avg || 4) ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                  );
                })}
              </div>
              <span className="text-xs text-muted-foreground font-bold">
                {reviews.length > 0 
                  ? `${(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} (${reviews.length} reviews)`
                  : 'No reviews yet'}
              </span>
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

        {/* ── Reviews Section ───────────────────────────────────── */}
        <section className="mt-20 pt-20 border-t border-border/40">
           <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-6">
                 <h2 className="text-3xl font-black flex items-center gap-3">
                   <MessageSquare className="h-8 w-8 text-primary" />
                   Customer Reviews
                 </h2>
                 <p className="text-muted-foreground font-bold leading-relaxed">
                   Here&apos;s what people think about {product.name}. Based on authentic customer experiences.
                 </p>
                 
                 {/* Summary Stats */}
                 <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                       <span className="text-5xl font-black">
                         {reviews.length > 0 
                           ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                           : '0.0'}
                       </span>
                       <div>
                          <div className="flex text-warning">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 fill-current ${i < Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)) ? 'opacity-100' : 'opacity-20'}`} />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground font-black uppercase mt-1">Average rating</p>
                       </div>
                    </div>
                    
                    {/* Rating Breakdown */}
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3 mb-2">
                           <span className="text-xs font-black min-w-4">{star}</span>
                           <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                           </div>
                           <span className="text-[10px] text-muted-foreground font-bold min-w-8">{count}</span>
                        </div>
                      );
                    })}
                 </div>

                 {/* Write Review Form */}
                 {user ? (
                   <form onSubmit={handleSubmitReview} className="bg-primary/5 rounded-3xl p-6 border border-primary/20 space-y-4">
                      <h3 className="font-black text-lg">Leave a Review</h3>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button 
                            key={s} 
                            type="button" 
                            onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                            className={`p-1 group transition-all ${reviewForm.rating >= s ? 'text-warning fill-warning' : 'text-muted-foreground/30 hover:text-warning'}`}
                          >
                             <Star className={`h-6 w-6 ${reviewForm.rating >= s ? 'fill-current' : 'group-hover:fill-current'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea 
                        required
                        placeholder="What did you like or dislike?"
                        className="w-full min-h-[100px] bg-card border border-border rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      />
                      <button 
                        type="submit" 
                        disabled={isSubmittingReview}
                        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                      >
                         {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Post Review</>}
                      </button>
                   </form>
                 ) : (
                   <div className="bg-muted/30 rounded-3xl p-6 border border-border text-center">
                      <p className="text-xs font-bold text-muted-foreground mb-4">You must be logged in to leave a review</p>
                      <Link href="/login" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-black shadow-lg shadow-primary/10">Sign In</Link>
                   </div>
                 )}
              </div>

              <div className="lg:col-span-2 space-y-6">
                 {reviews.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                       <MessageSquare className="h-10 w-10 opacity-20 mb-4" />
                       <p className="font-bold">No reviews yet for this product</p>
                       <p className="text-xs">Be the first to share your experience!</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {reviews.map(r => (
                          <div key={r.id} className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm flex gap-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
                             <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                                <User className="h-6 w-6 text-muted-foreground" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                   <p className="font-black text-foreground truncate">{r.customerName}</p>
                                   <span className="text-[10px] text-muted-foreground font-bold">{new Date(r.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex text-warning mb-3">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`h-3 w-3 fill-current ${i < r.rating ? '' : 'opacity-20'}`} />
                                   ))}
                                </div>
                                <p className="text-sm font-bold text-muted-foreground leading-relaxed italic">&quot;{r.comment}&quot;</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </section>

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
                        {p.image_url ? (
                          <Image 
                            src={p.image_url} 
                            alt={p.name} 
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 250px"
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
