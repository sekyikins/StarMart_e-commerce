'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore, useToastStore } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getProducts, getCategories } from '@/lib/db';
import { Product } from '@/lib/types';
import { SlidersHorizontal, Search } from 'lucide-react';

import { useRealtimeTable } from '@/hooks/useRealtimeTable';

function StorefrontContent() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cart = useCartStore();
  const { addToast, toasts } = useToastStore();

  const { data: products, isLoading: isLoadingProducts } = useRealtimeTable<Product>({
    table: 'products',
    initialData: [],
    fetcher: getProducts,
    refetchOnChange: true
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const filtered = products
    .filter(p =>
      (!selectedCat || p.category === selectedCat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) { addToast('Out of stock', 'error'); return; }
    cart.addItem(product);
    addToast(`Added ${product.name} to cart`, 'success');
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar onCartToggle={() => setIsCartOpen(true)} searchQuery={search} onSearchChange={setSearch} showSearch />

      {/* Hero */}
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white py-12 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">Shop Everything</h1>
        <p className="text-indigo-200 text-lg max-w-md mx-auto">Discover our full catalogue of quality products, delivered to your door.</p>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Filter Engine UI */}
        <div className="flex flex-col space-y-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-bold text-lg tracking-tight">Categories</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Filter categories..."
                  className="pl-9 pr-4 py-2 text-xs font-bold bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full sm:w-48 placeholder:text-muted-foreground/50"
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    setCategorySearch(term);
                  }}
                />
              </div>
              <span className="h-6 w-px bg-border mx-1 hidden sm:block" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as typeof sortBy)} 
                className="text-xs font-bold bg-card border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm hover:border-primary/50"
              >
                <option value="name">A–Z</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
            <button 
              onClick={() => setSelectedCat('')} 
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap hover:cursor-pointer transition-all border shadow-sm ${!selectedCat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary'}`}
            >
              All Products
            </button>
            {categories.filter(c => c.toLowerCase().includes(categorySearch)).map(c => (
              <button 
                key={c} 
                onClick={() => setSelectedCat(c)} 
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap hover:cursor-pointer transition-all border shadow-sm ${selectedCat === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>


        <p className="text-sm text-zinc-500 mb-4">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
        <ProductGrid products={filtered} onAddToCart={handleAddToCart} isLoading={isLoadingProducts} />
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-3 ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function HomePage() {
  return <StorefrontContent />;
}
