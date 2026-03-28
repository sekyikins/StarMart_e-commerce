'use client';
import React, { useState } from 'react';
import { useCartStore, useSettingsStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { placeOrder, getDeliveryPoints } from '@/lib/db';
import { X, Minus, Plus, ShoppingBag, MapPin, CreditCard, Smartphone, CheckCircle2, Package, Copy, ChevronLeft, ArrowRight, Loader2, Search, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'CART' | 'DELIVERY' | 'PAYMENT' | 'SUMMARY' | 'SUCCESS';

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const cart = useCartStore();
  const { user } = useAuth();
  const { currencySymbol, storeName } = useSettingsStore();
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>('CART');
  const [deliveryPoints, setDeliveryPoints] = React.useState<{ id: string; name: string; address: string }[]>([]);
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MOBILE_MONEY' | 'PAY_ON_DELIVERY'>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen && step === 'DELIVERY') {
      getDeliveryPoints().then(setDeliveryPoints).catch(console.error);
    }
  }, [isOpen, step]);

  const handleStartCheckout = () => {
    if (!user) {
      onClose();
      router.push('/login?next=checkout');
      return;
    }
    setStep('DELIVERY');
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const order = await placeOrder({
        storefrontUserId: user.id,
        deliveryPointId: useCustomAddress ? undefined : selectedDeliveryPoint || undefined,
        deliveryAddress: useCustomAddress ? customAddress : undefined,
        totalAmount: cart.getTotal(),
        paymentMethod,
        items: cart.items.map(i => ({ productId: i.productId, productName: i.productName, price: i.price, quantity: i.quantity, subtotal: i.subtotal })),
      });
      setOrderId(order.id);
      cart.clearCart(user.id);
      setStep('SUCCESS');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!orderId) return;
    const shortId = orderId.slice(-8).toUpperCase();
    navigator.clipboard.writeText(shortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceedFromDelivery = useCustomAddress ? customAddress.trim().length > 3 : !!selectedDeliveryPoint;

  const renderHeader = () => {
    const titles: Record<CheckoutStep, { icon: LucideIcon; text: string }> = {
      CART: { icon: ShoppingBag, text: 'Your Cart' },
      DELIVERY: { icon: MapPin, text: 'Delivery' },
      PAYMENT: { icon: CreditCard, text: 'Payment' },
      SUMMARY: { icon: Package, text: 'Review' },
      SUCCESS: { icon: CheckCircle2, text: 'Success' },
    };
    const ActiveIcon = titles[step].icon;

    return (
      /* Cart Header */
      <div className="flex items-center justify-between p-5 border-b border-border shrink-0 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {step !== 'CART' && step !== 'SUCCESS' && (
            <button 
              onClick={() => {
                if (step === 'DELIVERY') setStep('CART');
                if (step === 'PAYMENT') setStep('DELIVERY');
                if (step === 'SUMMARY') setStep('PAYMENT');
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
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-background flex flex-col shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {renderHeader()}

        {/* STEPPER PROGRESS (only during checkout) */}
        {step !== 'CART' && step !== 'SUCCESS' && (
          <div className="px-6 py-3 bg-card/30 border-b border-border flex justify-between gap-2 overflow-hidden shrink-0">
            {['DELIVERY', 'PAYMENT', 'SUMMARY'].map((s, idx) => {
              const isActive = step === s;
              const isPast = (step === 'PAYMENT' && s === 'DELIVERY') || (step === 'SUMMARY' && (s === 'DELIVERY' || s === 'PAYMENT'));
              return (
                <div key={s} className="flex-1 flex flex-col gap-1.5">
                   <div className={`h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-primary w-full' : isPast ? 'bg-success w-full' : 'bg-muted w-2'}`} />
                   <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : isPast ? 'text-success' : 'text-muted-foreground/50'}`}>
                      {idx + 1}. {s}
                   </span>
                </div>
              );
            })}
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          
          {/* 1. CART PAGE */}
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
                <>
                  <div className="space-y-3">
                    {cart.items.map(item => (
                      <div key={item.productId} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all group">
                        <div className="h-15 w-15 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-2xl shrink-0 uppercase shadow-inner overflow-hidden relative">
                          {item.image_url ? (
                            <Image 
                              src={item.image_url} 
                              alt={item.productName} 
                              fill
                              className="object-cover"
                            />
                          ) : (
                            item.productName.charAt(0)
                          )}
                          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="flex justify-between items-start gap-2">
                             <p className="font-bold text-foreground text-base tracking-tight truncate leading-tight">{item.productName}</p>
                             <button onClick={() => cart.removeItem(item.productId, user?.id)} className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors"><X className="h-4 w-4"/></button>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="flex items-center rounded-xl border-2 border-border bg-background p-0.5">
                              <button className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors" onClick={() => item.quantity > 1 ? cart.updateQuantity(item.productId, item.quantity - 1, user?.id) : cart.removeItem(item.productId, user?.id)}><Minus className="h-3 w-3"/></button>
                              <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                             <button className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded-lg transition-colors" onClick={() => cart.updateQuantity(item.productId, item.quantity + 1, user?.id)}><Plus className="h-3 w-3"/></button>
                            </div>
                            <p className="font-bold text-primary text-base">{currencySymbol}{item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. DELIVERY PAGE */}
          {step === 'DELIVERY' && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-6">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input type="text" placeholder="Search saved locations..." className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-border bg-card focus:border-primary outline-none transition-all font-medium text-sm shadow-sm" />
                 </div>
                 
                 <div className="grid grid-cols-1 gap-3">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] px-2">Saved Distribution Centers</p>
                    {deliveryPoints.map(dp => (
                      <button key={dp.id} onClick={() => { setSelectedDeliveryPoint(dp.id); setUseCustomAddress(false); }} className={`flex items-start gap-4 p-3 rounded-2xl border-2 text-left transition-all ${selectedDeliveryPoint === dp.id && !useCustomAddress ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-lg' : 'border-border bg-card hover:border-primary/30 shadow-sm'}`}>
                         <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${selectedDeliveryPoint === dp.id && !useCustomAddress ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                            <MapPin className="h-5 w-5" />
                         </div>
                         <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">{dp.name}</p>
                            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">{dp.address}</p>
                         </div>
                      </button>
                    ))}

                    <div className="pt-2">
                       <button onClick={() => setUseCustomAddress(true)} className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${useCustomAddress ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:border-primary/30 opacity-70'}`}>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${useCustomAddress ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                             <ArrowRight className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="font-bold text-sm">Enter Custom GPS Address</p>
                             <p className="text-xs text-muted-foreground font-medium mt-1">For direct doorstep delivery</p>
                          </div>
                       </button>
                       {useCustomAddress && (
                         <div className="mt-4 animate-in zoom-in-95 duration-200">
                           <textarea value={customAddress} onChange={e => setCustomAddress(e.target.value)} className="w-full rounded-2xl border-2 border-primary/50 bg-card p-5 text-sm font-bold text-foreground outline-none focus:border-primary transition-all resize-none shadow-xl" rows={4} placeholder="Floor, building, street, and landmark..." />
                         </div>
                       )}
                    </div>
                 </div>
               </div>
            </div>
          )}

          {/* 3. PAYMENT PAGE */}
          {step === 'PAYMENT' && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em] px-2 mb-4">Choose Method</p>
                  {(['CARD', 'MOBILE_MONEY', 'PAY_ON_DELIVERY'] as const).map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)} className={`flex items-center gap-5 p-3 rounded-2xl border-2 transition-all relative overflow-hidden group ${paymentMethod === m ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xl' : 'border-border bg-card hover:border-primary/40 shadow-sm'}`}>
                       <div className={`p-4 rounded-2xl transition-all ${paymentMethod === m ? 'bg-primary text-white scale-110' : 'bg-muted text-muted-foreground group-hover:text-primary'}`}>
                          {m === 'CARD' && <CreditCard className="h-6 w-6"/>}
                          {m === 'MOBILE_MONEY' && <Smartphone className="h-6 w-6"/>}
                          {m === 'PAY_ON_DELIVERY' && <Package className="h-6 w-6"/>}
                       </div>
                       <div className="flex-1">
                          <p className="font-bold text-base text-foreground uppercase tracking-tight">{m.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 tracking-widest">{m === 'PAY_ON_DELIVERY' ? 'Safe and Secure' : 'Instant Confirmation'}</p>
                       </div>
                       {paymentMethod === m && (
                         <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-300 shadow-lg shadow-primary/40">
                            <ArrowRight className="h-3 w-3 text-white" />
                         </div>
                       )}
                    </button>
                  ))}
               </div>
               
               {/* Dummy Card Info (Visible if CARD is selected) */}
               {paymentMethod === 'CARD' && (
                 <div className="bg-linear-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="absolute right-[-20px] top-[-20px] h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                    <div className="flex justify-between items-start mb-10">
                       <CreditCard className="h-8 w-8 text-white/50" />
                       <span className="font-bold text-sm tracking-widest italic opacity-60">{storeName.toUpperCase()} CARD</span>
                    </div>
                    <div className="space-y-4">
                       <p className="text-xl font-mono tracking-widest leading-none">•••• •••• •••• 8842</p>
                       <div className="flex justify-between items-end">
                          <div>
                             <p className="text-[8px] font-bold uppercase tracking-widest opacity-50 mb-1">Card Holder</p>
                             <p className="text-sm font-bold tracking-wide uppercase">{user?.name}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] font-bold uppercase tracking-widest opacity-50 mb-1">Expires</p>
                             <p className="text-sm font-bold tracking-wide">12/28</p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* 4. SUMMARY PAGE */}
          {step === 'SUMMARY' && (
            <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-24">
               <div className="space-y-4">
                 {/* Destination */}
                  <div className="bg-card rounded-2xl p-5 border-2 border-border shadow-sm">
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Ship To</span>
                        <button onClick={() => setStep('DELIVERY')} className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors underline uppercase tracking-tighter">Edit</button>
                     </div>
                     <div className="flex gap-4">
                        <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                        <div>
                          <p className="font-bold text-base text-foreground leading-tight">
                            {useCustomAddress ? 'Custom Address' : (deliveryPoints.find(d => d.id === selectedDeliveryPoint)?.name || 'Direct Delivery')}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                             {useCustomAddress ? customAddress : (deliveryPoints.find(d => d.id === selectedDeliveryPoint)?.address)}
                          </p>
                        </div>
                     </div>
                  </div>

                  {/* Payment */}
                  <div className="bg-card rounded-2xl p-5 border-2 border-border shadow-sm">
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Payment</span>
                        <button onClick={() => setStep('PAYMENT')} className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors underline uppercase tracking-tighter">Edit</button>
                     </div>
                     <div className="flex gap-4 items-center">
                        <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-bold text-base text-foreground leading-tight uppercase tracking-tight">{paymentMethod.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5 tracking-tight">Standard Processing Applied</p>
                        </div>
                     </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">Order Content</span>
                     <div className="bg-muted/20 rounded-3xl p-2 border-2 border-dashed border-border">
                        {cart.items.map(item => (
                          <div key={item.productId} className="flex justify-between items-center p-3 hover:bg-card/50 rounded-2xl transition-colors">
                            <span className="font-bold text-foreground truncate max-w-[240px] text-sm">{item.productName} <span className="text-muted-foreground text-xs ml-1">× {item.quantity}</span></span>
                            <span className="font-bold text-foreground text-sm">{useSettingsStore.getState().currencySymbol}{item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* 5. SUCCESS PAGE */}
          {step === 'SUCCESS' && (
            <div className="min-h-full flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-700">
               <div className="relative mb-5">
                  <div className="h-30 w-30 rounded-[3.5rem] bg-success/10 border-4 border-success/20 flex items-center justify-center animate-bounce shadow-special-success">
                    <CheckCircle2 className="h-16 w-16 text-success"/>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-success text-white font-bold text-[10px] uppercase shadow-lg ring-4 ring-background">Verified</div>
               </div>
               
               <div className="text-center space-y-4 mb-10 px-6">
                  <h2 className="text-4xl font-bold text-foreground tracking-tighter leading-none">Order Secure!</h2>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">Prepare for arrival. We&apos;ve sent the tracking details to your primary email address.</p>
               </div>

               <div className="w-full bg-card rounded-3xl p-4 border-2 border-border/50 group cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden shadow-2xl hover:border-primary/50" onClick={copyToClipboard}>
                 <div className="flex flex-col items-center gap-2 z-10 relative">
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.4em]">Tracking Reference</span>
                    <div className="flex items-center gap-4 py-4">
                      <span className="text-3xl font-bold text-foreground tracking-[0.3em] font-mono">{orderId?.slice(-8).toUpperCase()}</span>
                      <Copy className={`h-6 w-6 transition-all duration-300 ${copied ? 'text-success scale-125' : 'text-primary'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-primary px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 uppercase tracking-widest">{copied ? 'Identity Copied' : 'Tap to Copy reference'}</span>
                 </div>
                 {copied && <div className="absolute inset-0 bg-success/5 animate-in fade-in duration-300" />}
               </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        {step !== 'SUCCESS' && (
          <div className="p-4 border-t border-border bg-card/80 backdrop-blur-xl shrink-0 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.15)] z-20">
            {step === 'CART' && cart.items.length > 0 && (
              <div className="space-y-5">
                 <div className="flex justify-between items-end">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cart Subtotal</p>
                       <p className="text-[10px] font-bold text-muted-foreground/60 italic leading-none truncate w-32">{cart.getItemCount()} Premium items selected</p>
                    </div>
                    <p className="text-3xl font-bold text-foreground tracking-tighter">{useSettingsStore.getState().currencySymbol}{cart.getTotal().toFixed(2)}</p>
                 </div>
                 <button onClick={handleStartCheckout} className="w-full h-15 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-500/30 active:scale-95 group">
                    PROCEED TO CHECKOUT <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            )}

            {step === 'DELIVERY' && (
               <button 
                  onClick={() => setStep('PAYMENT')} 
                  disabled={!canProceedFromDelivery}
                  className="w-full h-15 rounded-2xl bg-primary text-white font-bold text-base flex items-center justify-center gap-4 transition-all shadow-xl shadow-primary/25 disabled:opacity-40 disabled:grayscale disabled:scale-100"
               >
                  NEXT: PAYMENT METHOD <ArrowRight className="h-5 w-5" />
               </button>
            )}

            {step === 'PAYMENT' && (
               <button 
                  onClick={() => setStep('SUMMARY')} 
                  className="w-full h-15 rounded-2xl bg-primary text-white font-bold text-base flex items-center justify-center gap-4 transition-all shadow-xl shadow-primary/25"
               >
                  REVIEW FINAL ORDER <ArrowRight className="h-5 w-5" />
               </button>
            )}

            {step === 'SUMMARY' && (
               <button 
                  onClick={handlePlaceOrder} 
                  disabled={isProcessing}
                  className="w-full h-15 rounded-2xl bg-success hover:bg-success/90 text-white font-bold text-base flex items-center justify-center gap-4 transition-all shadow-xl shadow-success/25 disabled:opacity-50"
               >
                  {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <>FINALIZE & ORDER · {useSettingsStore.getState().currencySymbol}{cart.getTotal().toFixed(2)} <CheckCircle2 className="h-5 w-5" /></>}
               </button>
            )}
          </div>
        )}

        {step === 'SUCCESS' && (
           <div className="p-8 border-t border-border bg-card shrink-0 space-y-3">
              <button 
                onClick={() => { router.push('/orders'); setStep('CART'); onClose(); }} 
                className="w-full h-15 rounded-2xl bg-foreground text-card font-bold shadow-2xl hover:opacity-90 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Go to My Journey <Package className="h-5 w-5" />
              </button>
              <button 
                onClick={() => { setStep('CART'); onClose(); }} 
                className="w-full h-15 rounded-2xl border-2 border-border font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm uppercase tracking-widest"
              >
                Back to Market
              </button>
           </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
        .h-15 { height: 3.75rem; }
        .shadow-special-success { box-shadow: 0 0 50px -10px rgba(34, 197, 94, 0.4); }
      `}</style>
    </>
  );
};
