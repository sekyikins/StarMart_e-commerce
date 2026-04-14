import React from 'react';
import { Product } from '@/lib/types';
import { ShoppingCart, Tag, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { useSettingsStore } from '@/lib/store';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, isLoading }) => {
  const { currencySymbol } = useSettingsStore();

  React.useEffect(() => {
    if (!isLoading && products.length > 0) {
      const savedScroll = sessionStorage.getItem('productGridScroll');
      if (savedScroll) {
        // Small delay to ensure DOM has painted the grid elements before scrolling
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'smooth' });
          sessionStorage.removeItem('productGridScroll');
        }, 100);
      }
    }
  }, [isLoading, products.length]);

  const handleProductClick = () => {
    sessionStorage.setItem('productGridScroll', window.scrollY.toString());
  };

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
            <Skeleton className="h-11 w-full rounded-xl bg-muted/40 mt-auto" />
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
        const lowStock = !outOfStock && product.quantity <= 10;
        const index = products.indexOf(product);
        return (
          <div key={product.id} className="bg-card rounded-2xl h-fit border border-border overflow-hidden flex flex-col group hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            {/* Clickable image area → detail page */}
            <Link title='View Product Details' href={`/products/${product.id}`} className="block" onClick={handleProductClick}>
              <div className={`aspect-square relative overflow-hidden flex items-center justify-center text-5xl font-bold select-none ${outOfStock ? 'bg-muted text-muted-foreground/30' : 'bg-primary/5 text-primary/20 group-hover:bg-primary/10'} transition-colors duration-300`}>
                {product.image_url ? (
                  <Image 
                    src={product.image_url} 
                    alt={product.name} 
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    priority={index < 5}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                ) : (
                  product.name.charAt(0)
                )}
                {/* Subtle hover overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {outOfStock && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[2px] z-10">
                    <span className="text-[12px] font-bold text-destructive border border-destructive bg-card px-2 py-0.5 rounded uppercase tracking-tighter">Out of Stock</span>
                  </div>
                )}
              </div>
            </Link>
            
            <Link href={`/products/${product.id}`} title='View Product Details'>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex flex-wrap">
                <div className="flex-1 min-w-20 block group/title" onClick={handleProductClick}>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{product.category}</p>
                  <h3 className="font-bold text-sm leading-tight line-clamp-2 text-foreground mb-1 group-hover/title:text-primary transition-colors">{product.name}</h3>
                </div>

                <div>
                  {lowStock && (
                    <p className="text-[12px] text-warning font-bold bg-warning/5 px-2 py-0.5 rounded-md border inline-block w-fit">
                      Only {product.quantity} left!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-md font-bold text-foreground">{currencySymbol}{product.price.toFixed(2)}</span>
                {/* Conspicuous "Add to Cart" button */}
                <button
                  onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
                  disabled={outOfStock}
                  title='Add to Cart'
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md shadow-primary/30 hover:scale-105 hover:shadow-lg hover:shadow-primary/40"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Add</span>
                  <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};
