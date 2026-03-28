import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

import { getStoreSettings } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return {
    title: { default: settings.storeName, template: `%s | ${settings.storeName}` },
    description: `Shop online with ${settings.storeName} — wide selection, fast delivery, best prices.`,
  };
}

import { AuthProvider } from '@/lib/auth';
import { SettingsInitializer } from '@/components/layout/SettingsInitializer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <SettingsInitializer>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </SettingsInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}
