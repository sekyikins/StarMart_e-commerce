'use client';
import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getProducts, getCategories } from '@/lib/db';
import { Product } from '@/lib/types';
import { useCartStore, useToastStore } from '@/lib/store';
import { SlidersHorizontal, Search } from 'lucide-react';

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cart = useCartStore();
  const { addToast, toasts } = useToastStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, c] = await Promise.all([getProducts(), getCategories()]);
        setProducts(p);
        setCategories(c);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar onCartToggle={() => setIsCartOpen(true)} searchQuery={search} onSearchChange={setSearch} showSearch />
      
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2 tracking-tight">Full Catalogue</h1>
          <p className="text-muted-foreground text-sm">Discover and filter our complete selection of products</p>
        </div>

        {/* Modern Filter Engine UI */}
        <div className="flex flex-col space-y-4 mb-8">
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

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button 
              onClick={() => setSelectedCat('')} 
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${!selectedCat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary'}`}
            >
              All Products
            </button>
            {categories.filter(c => c.toLowerCase().includes(categorySearch)).map(c => (
              <button 
                key={c} 
                onClick={() => setSelectedCat(c)} 
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${selectedCat === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {!isLoading && (
          <p className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-tighter">
            {filtered.length} matching product{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
        
        <ProductGrid products={filtered} onAddToCart={handleAddToCart} isLoading={isLoading} />
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)}/>
      
      {/* Toast Manager */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 border transform transition-all animate-in slide-in-from-right-full ${t.type === 'success' ? 'bg-green-600/90 backdrop-blur-md text-white border-green-500/50' : t.type === 'error' ? 'bg-red-600/90 backdrop-blur-md text-white border-red-500/50' : 'bg-card/90 backdrop-blur-md text-foreground border-border'}`}>
             {t.message}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return <AuthProvider><ProductsContent /></AuthProvider>;
}

