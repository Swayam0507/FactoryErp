import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'VivekBhai Industries — Factory ERP',
  description:
    'Production-ready factory attendance, salary, and employee management system.',
  keywords: 'factory ERP, attendance management, salary management, employee management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.variable} font-sans antialiased bg-zinc-50 text-zinc-900`}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
