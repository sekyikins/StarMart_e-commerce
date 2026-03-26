'use client';
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getOrdersByUser, cancelOrder } from '@/lib/db';
import { Navbar } from '@/components/layout/Navbar';
import { Skeleton } from '@/components/ui/Skeleton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useRouter } from 'next/navigation';
import { Package, Clock, CheckCircle2, XCircle, Truck, AlertCircle, CreditCard, MapPin, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useToastStore } from '@/lib/store';
import { Order, OrderItem } from '@/lib/types';
import { useRealtimeTable, ConnectionStatus } from '@/hooks/useRealtimeTable';

const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType; desc: string }> = {
  PENDING:   { label: 'Pending',    color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200',  Icon: Clock,        desc: 'Waiting for staff to confirm your order.' },
  CONFIRMED: { label: 'Confirmed',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200',          Icon: Package,      desc: 'Our staff has taken care of your order and is preparing it.' },
  SHIPPED:   { label: 'In Transit', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200',  Icon: Truck,        desc: 'Your ordered goods are being delivered to your location.' },
  DELIVERED: { label: 'Delivered',  color: 'text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200',     Icon: CheckCircle2,  desc: 'Enjoy your products! Order successfully completed.' },
  CANCELLED: { label: 'Cancelled',  color: 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200',             Icon: XCircle,       desc: 'This order was cancelled and inventory has been restored.' },
};

function ConnectionPill({ status }: { status: ConnectionStatus }) {
  const map = {
    connected:    { icon: Wifi,    label: 'Live',       cls: 'text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200' },
    connecting:   { icon: Wifi,    label: 'Syncing…',   cls: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200' },
    disconnected: { icon: WifiOff, label: 'Offline',    cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200' },
    error:        { icon: WifiOff, label: 'Error',      cls: 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200' },
  }[status];
  const Icon = map.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${map.cls}`}>
      <Icon className="h-3 w-3" />{map.label}
    </span>
  );
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const meta = STATUS_META[order.status] ?? { label: order.status, color: '', Icon: AlertCircle, desc: '' };
  const { addToast } = useToastStore();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      addToast('Order cancelled successfully', 'success');
      onUpdate(); // Realtime will also reflect this automatically
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order';
      addToast(message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const isCancellable = ['PENDING', 'CONFIRMED'].includes(order.status);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden transition-all shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
        <div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">ORDER ID</p>
          <p className="text-sm font-bold mt-0.5 truncate max-w-[120px]">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">STATUS</p>
            <span className={`flex items-center justify-end gap-1.5 text-[10px] font-black uppercase tracking-tighter mt-0.5 ${meta.color.split(' ')[0]}`}>
              <meta.Icon className="h-3 w-3"/>{meta.label}
            </span>
          </div>
          <div className="h-10 w-px bg-border mx-1" />
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">TOTAL</p>
            <p className="font-black text-lg mt-0.5 text-foreground">${order.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-primary/5 border-b border-border flex items-center justify-between">
        <p className="text-xs font-bold text-primary flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" />
          {meta.desc}
        </p>
        {isCancellable && (
          <button 
            onClick={handleCancel}
            disabled={cancelling}
            className="text-[10px] font-black text-destructive hover:underline disabled:opacity-50 uppercase tracking-widest"
          >
            {cancelling ? 'CANCELLING...' : 'CANCEL ORDER'}
          </button>
        )}
      </div>

      <div className="p-5 space-y-3">
        {(order.items ?? []).map((item: OrderItem) => (
          <div key={item.id} className="flex justify-between text-sm items-center">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground uppercase">{item.productName.charAt(0)}</div>
              <span className="text-foreground/80 font-medium">{item.productName} <span className="text-muted-foreground text-xs ml-1 font-bold">×{item.quantity}</span></span>
            </div>
            <span className="font-bold text-foreground">${item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-3 font-bold uppercase tracking-widest flex-wrap">
        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{order.paymentMethod?.replace(/_/g,' ')}</span>
        <span>·</span>
        <span className="flex items-center gap-1 flex-1 truncate"><MapPin className="h-3 w-3" />{order.deliveryAddress || 'Pick-up Point'}</span>
        <span>·</span>
        <span>{new Date(order.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</span>
      </div>
    </div>
  );
}

function OrdersContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Stable fetcher — created once user becomes available
  const fetcher = React.useCallback(
    () => (user ? getOrdersByUser(user.id) : Promise.resolve([])),
    [user]
  );

  const { data: orders, isLoading, connectionStatus, refetch } = useRealtimeTable<Order>({
    table: 'online_orders',
    initialData: [],
    fetcher,
    filter: user ? { column: 'e_customer_id', value: user.id } : undefined,
    disabled: !user,
    // online_orders rows are fetched with a join (order items) and a camelCase mapper.
    // Raw realtime payloads are snake_case without joins, so we must refetch on any change.
    refetchOnChange: true,
  });

  React.useEffect(() => {
    if (!authLoading && !user) router.push('/login?next=/orders');
  }, [user, authLoading, router]);

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar onCartToggle={() => setIsCartOpen(true)} />
      <div className="max-w-3xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-black text-foreground">My Orders</h1>
          <ConnectionPill status={connectionStatus} />
        </div>
        <p className="text-muted-foreground text-sm mb-8">Track and review your recent orders — updates arrive instantly.</p>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden p-6 space-y-4 shadow-sm animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-32" /></div>
                  <div className="flex gap-2 items-center"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-8 w-12" /></div>
                </div>
                <Skeleton className="h-8 w-full rounded-lg" />
                <div className="space-y-2 pt-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30"/>
            <p className="font-black text-xl text-foreground">No orders yet</p>
            <Link href="/" className="mt-4 inline-block text-primary font-bold hover:underline text-sm">Start shopping →</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(o => <OrderCard key={o.id} order={o} onUpdate={refetch}/>)}
          </div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 pb-10 grayscale opacity-50">
          <Link href="/terms" className="text-xs font-bold text-muted-foreground hover:text-foreground">TERMS &amp; CONDITIONS</Link>
          <Link href="/faq" className="text-xs font-bold text-muted-foreground hover:text-foreground">REFUND POLICY &amp; FAQS</Link>
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
    </main>
  );
}

export default function OrdersPage() {
  return <OrdersContent />;
}
