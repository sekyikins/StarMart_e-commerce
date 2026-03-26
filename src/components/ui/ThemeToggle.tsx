'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render once mounted on client
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  const cycle = () => {
    if (theme === 'system') setTheme(isDark ? 'light' : 'dark');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <button
      onClick={cycle}
      title={`Theme: ${theme} — click to cycle`}
      className="relative h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:scale-105 active:scale-95"
    >
      {theme === 'system' ? (
        <Monitor className="h-4 w-4" />
      ) : isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
