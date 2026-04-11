'use client';
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/store';

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const { storeName } = useSettingsStore();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const ok = await login(email, password);
    if (ok) {
      router.push(searchParams.get('next') ?? '/');
    } else {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-3xl shadow-xl border border-border p-8">
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShoppingBag className="h-7 w-7 text-white"/>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm text-center mb-6">Sign in to your {storeName} account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground"/>
            <input type="email" value={email} autoFocus onChange={e => setEmail(e.target.value)} placeholder="Email address" required className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary text-sm"/>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground"/>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-card text-foreground outline-none focus:ring-2 focus:ring-primary text-sm"/>
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
            </button>
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all hover:scale-[1.02] disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { storeName } = useSettingsStore();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-white"/></div>
        <span className="font-bold text-xl">{storeName}</span>
      </Link>
      <React.Suspense><LoginContent /></React.Suspense>
    </div>
  );
}
