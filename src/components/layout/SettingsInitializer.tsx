'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store';

export function SettingsInitializer({ children }: { children: React.ReactNode }) {
  const { fetchSettings, isInitialized } = useSettingsStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchSettings();
    }
  }, [fetchSettings, isInitialized]);

  return <>{children}</>;
}
