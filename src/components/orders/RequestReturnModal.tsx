'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertCircle, PackageX, Minus, Plus } from 'lucide-react';
import { requestOnlineReturn, checkReturnEligibility, getProductById } from '@/lib/db';
import { Order } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useToastStore, useSettingsStore } from '@/lib/store';

interface RequestReturnModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestReturnModal({ order, isOpen, onClose, onSuccess }: RequestReturnModalProps) {
  const { user } = useAuth();
  const { addToast } = useToastStore();
  const { currencySymbol } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // orderItems augmented with is_returnable after async check
  const [returnableItems, setReturnableItems] = useState<{id: string, name: string, qty: number, price: number, is_returnable: boolean}[]>([]);
  
  const [reason, setReason] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && user) {
      loadEligibility();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const loadEligibility = async () => {
    setIsChecking(true);
    try {
      await checkReturnEligibility(order.id, user!.id);
      
      const itemsList = [];
      const initQtys: Record<string, number> = {};
      
      for (const i of order.items || []) {
        const prod = await getProductById(i.productId);
        const isReturnable = prod?.is_returnable ?? true;
        
        itemsList.push({
          id: i.productId,
          name: i.productName || 'Product',
          qty: i.quantity,
          price: i.price,
          is_returnable: isReturnable
        });
        
        if (isReturnable) initQtys[i.productId] = 0;
      }
      
      setReturnableItems(itemsList);
      setReturnQuantities(initQtys);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Not eligible for return', 'error');
      onClose();
    } finally {
      setIsChecking(false);
    }
  };

  const handleQuantityChange = (productId: string, change: number, max: number) => {
    setReturnQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(max, current + change));
      return { ...prev, [productId]: next };
    });
  };

  const handleSubmit = async () => {
    const selectedItems = returnableItems.filter(i => returnQuantities[i.id] > 0);
    if (selectedItems.length === 0) {
      addToast('Please select at least one item to return.', 'error');
      return;
    }
    if (!reason.trim()) {
      addToast('Please provide a reason for the return.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const itemsPayload = selectedItems.map(i => ({
        productId: i.id,
        quantity: returnQuantities[i.id],
        unitPrice: i.price
      }));

      await requestOnlineReturn(order.id, user!.id, reason, itemsPayload);
      
      addToast('Return request submitted successfully.', 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to submit request.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const totalReturnQuantity = Object.values(returnQuantities).reduce((a, b) => a + b, 0);
  
  let returnSubtotal = 0;
  returnableItems.forEach(i => {
    if (returnQuantities[i.id] > 0) {
      returnSubtotal += i.price * returnQuantities[i.id];
    }
  });
  const estimatedRefund = returnSubtotal * 0.8;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request a Return" size="md">
      {isChecking ? (
        <div className="py-12 flex items-center justify-center text-muted-foreground/50">
          <p className="animate-pulse font-medium">Checking eligibility...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-xl border border-border flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Order ID</p>
              <p className="font-medium text-sm">#{order.id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Date Delivered</p>
              <p className="font-medium text-sm">{new Date(order.completedAt || order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Select Items to Return</label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {returnableItems.map(item => {
                const qty = returnQuantities[item.id] || 0;
                return (
                  <div key={item.id} className={`p-3 rounded-xl border ${item.is_returnable ? 'border-border bg-card' : 'border-destructive/20 bg-destructive/5 opacity-70'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Purchased: {item.qty} × {currencySymbol}{item.price.toFixed(2)}</p>
                        {!item.is_returnable && (
                           <p className="text-[10px] font-bold text-destructive flex items-center gap-1 mt-1">
                             <PackageX className="h-3 w-3" /> Non-returnable category
                           </p>
                        )}
                      </div>
                    </div>
                    {item.is_returnable && (
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-medium text-muted-foreground">Return Qty:</span>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => handleQuantityChange(item.id, -1, item.qty)}
                            disabled={qty === 0}
                            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center font-bold text-sm tracking-tighter">{qty}</span>
                          <button 
                            type="button"
                            onClick={() => handleQuantityChange(item.id, 1, item.qty)}
                            disabled={qty === item.qty}
                            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Reason for Return</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why are you requesting a return? E.g., Item was damaged, incorrect product..."
              className="w-full h-24 p-3 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary">
              <AlertCircle className="h-5 w-5" />
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Estimated Refund</span>
                 <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Subject to 20% restocking fee</span>
              </div>
            </div>
            <span className="text-2xl font-black tracking-tighter text-primary">{currencySymbol}{estimatedRefund.toFixed(2)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-3">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="button" onClick={handleSubmit} disabled={isLoading || totalReturnQuantity === 0 || !reason.trim()}>
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
