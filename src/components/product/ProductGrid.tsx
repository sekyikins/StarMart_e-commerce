import React from 'react';
import { Product } from '@/lib/types';
import { ShoppingCart, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col p-4 space-y-4 shadow-sm animate-pulse">
             <Skeleton className="aspect-square w-full rounded-2xl bg-muted/40" />
             <div className="space-y-2">
                <Skeleton className="h-3 w-1/4 rounded bg-muted/30" />
                <Skeleton className="h-5 w-3/4 rounded bg-muted/50" />
             </div>
             <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
               <Skeleton className="h-7 w-20 rounded-lg bg-muted/40" />
               <Skeleton className="h-10 w-10 rounded-xl bg-muted/60" />
             </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Tag className="h-12 w-12 mb-3 opacity-30"/>
        <p className="font-medium">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
      {products.map(product => {
        const outOfStock = product.quantity <= 0;
        const lowStock = !outOfStock && product.quantity <= 5;
        return (
          <div key={product.id} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            {/* Image placeholder with stylised initials */}
            <div className={`aspect-square relative overflow-hidden flex items-center justify-center text-4xl font-black select-none ${outOfStock ? 'bg-muted text-muted-foreground/30' : 'bg-primary/5 text-primary/20'} group-hover:scale-105 transition-transform duration-500`}>
              {product.name.charAt(0)}
              {outOfStock && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-[10px] font-bold text-muted-foreground border border-border bg-card px-2 py-0.5 rounded uppercase tracking-tighter">Out of Stock</span>
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{product.category}</p>
              <h3 className="font-bold text-sm leading-tight line-clamp-2 text-foreground mb-2 flex-1">{product.name}</h3>

              {lowStock && (
                <p className="text-[10px] text-warning font-semibold mb-1">Only {product.quantity} left!</p>
              )}

              <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
                <span className="text-xl font-black text-foreground">${product.price.toFixed(2)}</span>
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={outOfStock}
                  className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                >
                  <ShoppingCart className="h-4 w-4"/>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

};
