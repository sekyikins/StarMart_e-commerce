'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getReturnsByUser } from '@/lib/db';
import { Navbar } from '@/components/layout/Navbar';
import { Skeleton } from '@/components/ui/Skeleton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useRouter } from 'next/navigation';
import { RotateCcw, Clock, CheckCircle2, XCircle, AlertCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/store';
import { Return, ReturnItem } from '@/lib/types';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';

const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType; desc: string }> = {
  REQUESTED: { label: 'Requested', color: 'text-warning bg-warning/10', Icon: Clock, desc: 'Your return request is pending review.' },
  APPROVED:  { label: 'Approved',  color: 'text-info bg-info/10',    Icon: CheckCircle2, desc: 'Return approved! Please send the items back or drop them off.' },
  COMPLETED: { label: 'Completed', color: 'text-success bg-success/10',   Icon: CheckCircle2, desc: 'Refund has been successfully processed.' },
  REJECTED:  { label: 'Rejected',  color: 'text-destructive bg-destructive/10',       Icon: XCircle, desc: 'This return request was rejected.' },
};

function ReturnCard({ ret }: { ret: Return }) {
  const meta = STATUS_META[ret.status] ?? { label: ret.status, color: '', Icon: AlertCircle, desc: '' };
  const [copied, setCopied] = useState(false);
  const { currencySymbol } = useSettingsStore();

  const copyId = () => {
    navigator.clipboard.writeText(ret.id.slice(-8).toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="p-5 flex justify-between items-start border-b border-border/50">
        <div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">RETURN ID</p>
          <button 
            onClick={copyId} 
            className="flex items-center gap-1.5 text-sm cursor-pointer font-bold mt-0.5 hover:text-primary transition-colors text-left"
            title="Click to copy Return ID"
          >
            #{ret.id.slice(-8).toUpperCase()}
            {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 opacity-50" />}
          </button>
          {ret.orderId && <p className="text-[10px] text-muted-foreground mt-1 tracking-widest font-bold">ORDER ID: #{ret.orderId.slice(-8).toUpperCase()}</p>}
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 ${meta.color}`}>
          <meta.Icon className="h-3.5 w-3.5" />
          {meta.label}
        </div>
      </div>
      
      <div className="px-5 py-3 bg-primary/5 border-b border-border flex flex-col gap-1">
        <p className="text-xs font-bold text-primary flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" />
          {meta.desc}
        </p>
      </div>

      <div className="p-5 space-y-3">
        {(ret.items ?? []).map((item: ReturnItem) => (
          <div key={item.id} className="flex justify-between text-sm items-center">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">{item.productName?.charAt(0) || 'P'}</div>
              <span className="text-foreground/80 font-medium">
                 {item.productName || 'Product'} 
                 <span className="text-muted-foreground text-xs ml-1 font-bold">×{item.quantity}</span>
              </span>
            </div>
            <span className="font-bold text-foreground">{currencySymbol}{item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <div className="px-5 pb-5 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between items-center font-bold uppercase tracking-widest">
        <span>Reason: {ret.reason}</span>
        {ret.refundAmount && <span className="text-primary text-xs">REFUND: {currencySymbol}{ret.refundAmount.toFixed(2)}</span>}
      </div>

      {ret.status === 'REJECTED' && ret.rejectionReason && (
        <div className="px-5 py-3 text-xs font-bold bg-destructive/10 text-destructive border-t border-border/50">
          Rejection Note: {ret.rejectionReason}
        </div>
      )}
    </div>
  );
}

function ReturnsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: returns, isLoading: loadingReturns } = useRealtimeTable<Return>({
    table: 'returns',
    initialData: [],
    fetcher: () => user ? getReturnsByUser(user.id) : Promise.resolve([]),
    filter: user ? { column: 'customer_id', value: user.id } : undefined,
    refetchOnChange: !!user
  });

  const isLoading = authLoading || loadingReturns;

  React.useEffect(() => {
    if (!authLoading && !user) router.push('/login?next=/returns');
  }, [user, authLoading, router]);

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar onCartToggle={() => setIsCartOpen(true)} />
      <div className="max-w-3xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-foreground">My Returns</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">Track your return requests and their progress.</p>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden p-6 space-y-4 shadow-sm animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-32" /></div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
            <RotateCcw className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30"/>
            <p className="font-bold text-xl text-foreground">No returns yet</p>
            <Link href="/orders" className="mt-4 inline-block text-primary font-bold hover:underline text-sm">View your orders →</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {returns.map(ret => <ReturnCard key={ret.id} ret={ret} />)}
          </div>
        )}

        <div className="mt-12 flex justify-center items-center gap-8 grayscale opacity-50">
          <Link href="/faq" className="text-xs font-bold text-muted-foreground hover:text-foreground">REFUND POLICY</Link>
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
    </main>
  );
}

export default function ReturnsPage() {
  return <ReturnsContent />;
}
