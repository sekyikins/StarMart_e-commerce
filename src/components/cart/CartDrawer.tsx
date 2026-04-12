'use client';
import React, { useState } from 'react';
import { useCartStore, useSettingsStore, useToastStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { placeOrder, getDeliveryPoints, getPromotionByCode, getProducts } from '@/lib/db';
import { Promotion } from '@/lib/types';
import { X, Minus, Plus, ShoppingBag, MapPin, CreditCard, CheckCircle2, Package, Copy, ChevronLeft, ArrowRight, Loader2, AlertCircle, Tag, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const PaystackHandler = dynamic(() => import('./PaystackHandler'), { ssr: false });
import confetti from 'canvas-confetti';
import { Check } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'CART' | 'DELIVERY' | 'PROMO' | 'PAYMENT' | 'SUMMARY' | 'SUCCESS';

import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { Product } from '@/lib/types';

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const cart = useCartStore();
  const { user } = useAuth();
  const { currencySymbol, currency, storeName } = useSettingsStore();
  const { addToast } = useToastStore();
  
  const paystackInitializeRef = React.useRef<((options: { onSuccess?: (res: { reference: string }) => void; onClose?: () => void }) => void) | null>(null);
  // Real-time synchronization for cart items
  const { data: allProducts } = useRealtimeTable<Product>({
    table: 'products',
    initialData: [],
    fetcher: getProducts,
    refetchOnChange: true
  });

  React.useEffect(() => {
    if (allProducts.length > 0) {
      cart.refreshPrices(allProducts);
    }
  }, [allProducts, cart]);

  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>('CART');
  const [deliveryPoints, setDeliveryPoints] = React.useState<{ id: string; name: string; address: string }[]>([]);
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PAYSTACK' | 'PAY_ON_DELIVERY'>('PAYSTACK');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paystackReference, setPaystackReference] = useState<string | null>(null);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const subtotal = cart.getTotal();
  const deliveryFee = useCustomAddress ? 15 : 0;
  
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'PERCENT') {
      promoDiscount = subtotal * (appliedPromo.discountValue / 100);
    } else {
      promoDiscount = appliedPromo.discountValue;
    }
  }
  const finalTotal = Math.max(0, subtotal - promoDiscount + deliveryFee);
  
  const handlePaystackPayment = () => {
    if (!user?.email) {
      addToast('Please ensure your email is set in your profile before paying with Paystack.', 'error');
      return;
    }
    
    if (finalTotal <= 0) {
      addToast('Amount must be greater than zero.', 'error');
      return;
    }

    if (!paystackInitializeRef.current) {
      addToast('Payment system is initializing. Please try again in a moment.', 'info');
      return;
    }

    setIsProcessing(true);
    paystackInitializeRef.current({
      onSuccess: (response: { reference: string }) => {
        setPaystackReference(response.reference);
        setIsPaymentCompleted(true);
        setIsProcessing(false);
      },
      onClose: () => {
        setIsProcessing(false);
        addToast('Payment cancelled.', 'info');
      },
    });
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const promo = await getPromotionByCode(promoCodeInput);
      if (!promo) {
        setPromoError('Invalid or inactive promo code');
      } else if (promo.minSubtotal && subtotal < promo.minSubtotal) {
        setPromoError(`Minimum order amount of ${currencySymbol}${promo.minSubtotal.toFixed(2)} required`);
      } else {
        setAppliedPromo(promo);
        setPromoCodeInput('');
      }
    } catch (err) {
      console.error(err);
      setPromoError('Failed to verify promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handlePlaceOrder = React.useCallback(async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    setIsPaymentCompleted(false); 
    try {
      const order = await placeOrder({
        customerId: user.id,
        deliveryPointId: useCustomAddress ? undefined : selectedDeliveryPoint || undefined,
        deliveryAddress: useCustomAddress ? customAddress : undefined,
        totalAmount: finalTotal,
        deliveryFee: deliveryFee,
        paymentMethodId: paymentMethod,
        paymentReference: paystackReference || undefined,
        promotionId: appliedPromo?.id,
        items: cart.items.map(i => ({ productId: i.productId, price: i.price, costPrice: i.costPrice, quantity: i.quantity, subtotal: i.subtotal })),
      });
      setOrderId(order.id);
      cart.clearCart();
      setAppliedPromo(null);
      setPaystackReference(null);
      setIsPaymentCompleted(false);
      addToast('Order placed successfully!', 'success');
      setStep('SUCCESS');
    } catch (err: unknown) {
      console.error('Checkout Error Full Details:', JSON.stringify(err, null, 2));
      const error = err as Record<string, unknown>;
      const msg = (error?.message as string) || 'Failed to place order. Please try again.';
      addToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, useCustomAddress, selectedDeliveryPoint, customAddress, finalTotal, deliveryFee, paymentMethod, paystackReference, appliedPromo, cart, addToast]);

  // Effect to auto-place order after Paystack success
  React.useEffect(() => {
    if (isPaymentCompleted && paystackReference && step === 'SUMMARY') {
      handlePlaceOrder();
    }
  }, [isPaymentCompleted, paystackReference, step, handlePlaceOrder]);

  React.useEffect(() => {
    if (isOpen && step === 'DELIVERY') {
      getDeliveryPoints().then(setDeliveryPoints).catch(console.error);
    }
  }, [isOpen, step]);

  React.useEffect(() => {
    if (step === 'SUCCESS') {
      // Big celebration on success
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#10B981', '#F59E0B']
      });

      const timer = setTimeout(() => {
        setStep('CART');
        onClose();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  // Reset checkout step if items change while drawer is closed
  const itemCount = cart.getItemCount();
  const prevItemCount = React.useRef(itemCount);

  React.useEffect(() => {
    if (!isOpen && itemCount !== prevItemCount.current) {
      setStep('CART');
    }
    prevItemCount.current = itemCount;
  }, [isOpen, itemCount]);

  const handleStartCheckout = () => {
    if (!user) {
      onClose();
      const returnUrl = window.location.pathname !== '/login' ? window.location.pathname : '/';
      router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setStep('DELIVERY');
  };



  const copyToClipboard = () => {
    if (!orderId) return;
    const shortId = orderId.slice(-8).toUpperCase();
    navigator.clipboard.writeText(shortId);
    setCopied(true);
    
    // Add a small celebration on copy
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.7 },
      colors: ['#4F46E5', '#10B981']
    });

    addToast('Reference ID copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceedFromDelivery = useCustomAddress ? customAddress.trim().length > 3 : !!selectedDeliveryPoint;
  const canApplyPromo = promoCodeInput.trim().length > 3;

  const renderHeader = () => {
    const titles: Record<CheckoutStep, { icon: LucideIcon; text: string }> = {
      CART: { icon: ShoppingBag, text: 'Your Cart' },
      DELIVERY: { icon: MapPin, text: 'Delivery' },
      PROMO: { icon: Tag, text: 'Promotions' },
      PAYMENT: { icon: CreditCard, text: 'Payment' },
      SUMMARY: { icon: Package, text: 'Review & Pay' },
      SUCCESS: { icon: CheckCircle2, text: 'Success' },
    };
    const ActiveIcon = titles[step].icon;

    return (
      <div className="flex items-center justify-between p-5 border-b border-border shrink-0 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {step !== 'CART' && step !== 'SUCCESS' && (
            <button 
              onClick={() => {
                if (step === 'DELIVERY') setStep('CART');
                if (step === 'PROMO') setStep('DELIVERY');
                if (step === 'SUMMARY') setStep('PROMO');
              }}
              className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <h2 className="font-bold text-lg flex items-center gap-2 text-foreground tracking-tight">
            <ActiveIcon className={`h-5 w-5 ${step === 'SUCCESS' ? 'text-success' : 'text-primary'}`}/>
            {titles[step].text}
          </h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 group">
          <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-120 bg-background flex flex-col shadow-2xl transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {renderHeader()}
        <PaystackHandler
          email={user?.email || ''}
          amount={Math.round(finalTotal * 100)}
          publicKey={process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''}
          currency={currency}
          initializeRef={paystackInitializeRef}
        />

        {step !== 'CART' && step !== 'SUCCESS' && (
          <div className="px-6 py-3 bg-card/30 border-b border-border flex justify-between gap-2 overflow-hidden shrink-0">
            {['DELIVERY', 'PROMO', 'SUMMARY'].map((s, idx) => {
              const isActive = step === s;
              const isPast = (step === 'PROMO' && s === 'DELIVERY') || 
                             (step === 'SUMMARY' && (s === 'DELIVERY' || s === 'PROMO'));
              return (
                <div key={s} className="flex-1 flex flex-col gap-1.5">
                   <div className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-primary w-full' : isPast ? 'bg-success w-full' : 'bg-muted w-2'}`} />
                   <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : isPast ? 'text-success' : 'text-muted-foreground/50'}`}>
                      {idx + 1}. {s === 'SUMMARY' ? 'REVIEW' : s}
                   </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          
          {step === 'CART' && (
            <div className="p-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {cart.items.length === 0 ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                  <div className="h-24 w-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Shopping Bag is Empty</h3>
                  <p className="text-muted-foreground text-sm font-medium mb-8 px-12">Looking for something tasty? Browse our collection of premium fresh goods.</p>
                  <button onClick={onClose} className="px-4 py-3 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all active:scale-95">Explore Products</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map(item => (
                    <div key={item.productId} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all group">
                      <div className="h-15 w-15 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-2xl shrink-0 uppercase shadow-inner overflow-hidden relative">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.productName} fill className="object-cover" />
                        ) : (
                          item.productName.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="flex justify-between items-start gap-2">
                           <p className="font-bold text-foreground text-base tracking-tight truncate leading-tight">{item.productName}</p>
                           <button onClick={() => cart.removeItem(item.productId)} className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors"><X className="h-4 w-4"/></button>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex items-center rounded-xl border-2 border-border bg-background p-0.5">
                            <button className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors" onClick={() => item.quantity > 1 ? cart.updateQuantity(item.productId, item.quantity - 1) : cart.removeItem(item.productId)}><Minus className="h-3 w-3"/></button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors" onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}><Plus className="h-3 w-3"/></button>
                          </div>
                          <p className="font-bold text-primary text-base">{currencySymbol}{item.subtotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'DELIVERY' && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-3">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] px-2">{storeName} Centers</p>
                    {deliveryPoints.map(dp => (
                      <button key={dp.id} onClick={() => { setSelectedDeliveryPoint(dp.id); setUseCustomAddress(false); }} className={`flex items-start gap-4 p-3 rounded-2xl border-2 text-left transition-all ${selectedDeliveryPoint === dp.id && !useCustomAddress ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card hover:border-primary/30'}`}>
                         <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${selectedDeliveryPoint === dp.id && !useCustomAddress ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                            <MapPin className="h-5 w-5" />
                         </div>
                         <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">{dp.name}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{dp.address}</p>
                         </div>
                      </button>
                    ))}
                    <div className="pt-2">
                       <button onClick={() => setUseCustomAddress(true)} className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${useCustomAddress ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${useCustomAddress ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                             <ArrowRight className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="font-bold text-sm">Enter Custom GPS Address</p>
                             <p className="text-xs text-muted-foreground font-medium mt-1">Direct doorstep delivery</p>
                          </div>
                       </button>
                       {useCustomAddress && (
                         <div className="mt-4 space-y-3">
                           <div className="flex items-center gap-2 p-3 bg-warning/5 border-warning/80 rounded-xl text-warning text-[10px] font-bold uppercase tracking-widest">
                             <AlertCircle className="h-4 w-4" />
                             Note: Custom delivery attracts a {currencySymbol}15.00 non-refundable fee.
                           </div>
                           <textarea value={customAddress} onChange={e => setCustomAddress(e.target.value)} className="w-full rounded-2xl border-2 border-primary/50 bg-card p-5 text-sm font-bold text-foreground outline-none focus:border-primary transition-all resize-none shadow-xl" rows={4} placeholder="Floor, building, street, landmark..." />
                         </div>
                       )}
                    </div>
                 </div>
               </div>
            </div>
          )}

          {step === 'PROMO' && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Promotion</span>
                  <div className="bg-card rounded-2xl p-4 border-2 border-border shadow-sm flex flex-col gap-3">
                    {!appliedPromo ? (
                      <div className="flex gap-2">
                        <input type="text" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} placeholder="CODE..." className="flex-1 rounded-xl border-2 border-border bg-background px-4 text-sm font-bold h-12" />
                        <button 
                          onClick={handleApplyPromo} 
                          disabled={!canApplyPromo || isApplyingPromo} 
                          className="px-5 rounded-xl bg-primary text-white font-bold text-sm disabled:bg-primary/50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center min-w-[80px]"
                        >
                          {isApplyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-success/10 border-2 border-success/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-success" />
                          <p className="text-sm font-bold text-success">{appliedPromo.name}</p>
                        </div>
                        <button onClick={handleRemovePromo} className="text-success hover:text-destructive transition-colors"><X className="h-5 w-5"/></button>
                      </div>
                    )}
                    {promoError && <p className="text-xs font-bold text-destructive px-1">{promoError}</p>}
                  </div>
               </div>
            </div>
          )}

          {step === 'SUMMARY' && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-24">
               <div className="space-y-6">
                 <div className="space-y-4">
                  <div className="bg-card rounded-2xl p-5 border-2 border-border shadow-sm">
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Ship To</span>
                        <button onClick={() => setStep('DELIVERY')} className="text-[10px] font-bold text-muted-foreground underline">Edit</button>
                     </div>
                     <p className="font-bold text-sm text-foreground">{useCustomAddress ? 'Custom Address' : (deliveryPoints.find(d => d.id === selectedDeliveryPoint)?.name)}</p>
                     <p className="text-[11px] text-muted-foreground mt-1">{useCustomAddress ? customAddress : (deliveryPoints.find(d => d.id === selectedDeliveryPoint)?.address)}</p>
                  </div>

                  <div className="bg-muted/10 rounded-2xl p-4 border-2 border-dashed border-border">
                     <div className="space-y-2 mb-4">
                      {cart.items.map(item => (
                        <div key={item.productId} className="flex justify-between text-xs font-bold">
                          <span>{item.productName} ×{item.quantity}</span>
                          <span>{currencySymbol}{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                     </div>
                     <div className="pt-2 border-t border-border/40 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-muted-foreground"><span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span></div>
                        {promoDiscount > 0 && <div className="flex justify-between text-[11px] font-bold text-success"><span>Discount</span><span>-{currencySymbol}{promoDiscount.toFixed(2)}</span></div>}
                        {deliveryFee > 0 && <div className="flex justify-between text-[11px] font-bold text-foreground"><span>Delivery Fee</span><span>{currencySymbol}{deliveryFee.toFixed(2)}</span></div>}
                        <div className="flex justify-between items-center pt-2 text-sm font-black text-primary"><span>TOTAL</span><span>{currencySymbol}{finalTotal.toFixed(2)}</span></div>
                     </div>
                  </div>
                 </div>

                 <div className="space-y-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Payment</span>
                    <div className="grid grid-cols-1 gap-3">
                      {(['PAYSTACK', 'PAY_ON_DELIVERY'] as const).map(m => (
                        <button key={m} onClick={() => setPaymentMethod(m)} className={`flex items-center gap-4 p-3 rounded-2xl border-2 cursor-pointer ${paymentMethod === m ? 'border-primary bg-primary/5 shadow-md' : 'border-border bg-card'}`}>
                           <div className={`p-3 rounded-xl ${paymentMethod === m ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                              {m === 'PAYSTACK' ? <CreditCard className="h-5 w-5"/> : <Package className="h-5 w-5"/>}
                           </div>
                           <p className="flex-1 text-left font-bold text-xs">{m === 'PAYSTACK' ? 'Direct Payment (Paystack)' : 'Pay On Delivery'}</p>
                           <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m ? 'border-primary bg-primary' : 'border-border'}`}>
                              {paymentMethod === m && <CheckCircle2 className="h-3 w-3 text-white" />}
                           </div>
                        </button>
                      ))}
                    </div>
                 </div>
               </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="min-h-full flex flex-col items-center justify-center p-8 space-y-8 text-center bg-linear-to-b from-success/5 to-background">
              <div className="relative group">
                <div className="absolute -inset-4 bg-success/20 rounded-full blur-2xl group-hover:bg-success/30 transition-all duration-500 animate-pulse" />
                <div className="relative h-28 w-28 rounded-full bg-success text-white flex items-center justify-center shadow-2xl shadow-success/40 animate-in zoom-in-50 duration-500">
                  <CheckCircle2 className="h-14 w-14 animate-in slide-in-from-bottom-2 duration-700" />
                </div>
              </div>

              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <h2 className="text-4xl font-black text-foreground tracking-tight">Order Placed!</h2>
                <p className="text-muted-foreground font-medium max-w-[240px] mx-auto text-sm leading-relaxed">
                  Your order is being prepared. We&apos;ve sent the details to your email.
                </p>
              </div>

              <div 
                onClick={copyToClipboard}
                className={`w-full max-w-sm cursor-pointer relative group transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-400 ${
                  copied ? 'scale-95' : 'hover:scale-102 hover:-translate-y-1'
                }`}
              >
                <div className="absolute -inset-1 bg-linear-to-r from-primary to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <div className="relative bg-card border-2 border-border/50 rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-xl">
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Package className="h-3 w-3" />
                      Order Reference
                   </div>
                   
                   <div className="flex flex-col items-center">
                      <span className="text-3xl font-black text-primary tracking-[0.2em] font-mono">
                        {orderId?.slice(-8).toUpperCase()}
                      </span>
                      <div className="mt-4 flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors group-hover:text-primary">
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-success" />
                            <span className="text-success">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Click to Copy ID</span>
                          </>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {step !== 'SUCCESS' && (
          <div className="p-4 border-t border-border bg-card shrink-0">
            {step === 'CART' && cart.items.length > 0 && (
              <button onClick={handleStartCheckout} className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold cursor-pointer">CHECKOUT · {currencySymbol}{cart.getTotal().toFixed(2)}</button>
            )}
            {step === 'DELIVERY' && (
               <button onClick={() => setStep('PROMO')} disabled={!canProceedFromDelivery} className="w-full h-14 rounded-2xl bg-primary text-white font-bold opacity-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">PROCEED TO PROMO</button>
            )}
            {step === 'PROMO' && (
               <button onClick={() => setStep('SUMMARY')} className="w-full h-14 rounded-2xl bg-primary text-white font-bold cursor-pointer">REVIEW & PAY</button>
            )}
            {step === 'SUMMARY' && (
               <button onClick={() => paymentMethod === 'PAYSTACK' ? handlePaystackPayment() : handlePlaceOrder()} disabled={isProcessing} className="w-full h-14 rounded-2xl bg-primary text-white font-bold cursor-pointer">
                 {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (paymentMethod === 'PAYSTACK' ? `PAY ${currencySymbol}${finalTotal.toFixed(2)} NOW` : 'PLACE ORDER')}
               </button>
            )}
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="p-8 border-t border-border bg-card shrink-0 gap-4 flex animate-in slide-in-from-bottom-8 duration-700 delay-600">
            <button 
              onClick={() => { setStep('CART'); onClose(); }}
              className="flex-1 h-14 rounded-2xl border-2 border-border font-bold text-muted-foreground uppercase tracking-widest text-[10px] cursor-pointer hover:bg-muted transition-colors active:scale-95"
            >
              Back Home
            </button>
            <button 
              onClick={() => { router.push('/orders'); onClose(); }}
              className="flex-2 h-14 rounded-2xl bg-foreground text-background font-bold uppercase tracking-widest text-[10px] cursor-pointer shadow-xl shadow-foreground/10 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Package className="h-4 w-4" />
              View My Orders
            </button>
          </div>
        )}
      </div>
    </>
  );
};
