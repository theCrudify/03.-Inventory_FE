import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { Spinner, Toaster } from '@/components/ui';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const sans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// The real app name comes from master settings and is applied client-side (MetaProvider / login).
export const metadata: Metadata = { title: 'IT Inventory', description: 'IT Inventory Kawasan Berikat' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        {/* Fully client-rendered app: URL hooks resolve at runtime. */}
        <Suspense fallback={<Spinner label="Memuat…" />}><AuthProvider>{children}</AuthProvider></Suspense>
        <Toaster />
      </body>
    </html>
  );
}
