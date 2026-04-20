import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'sonner';

const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700', '800'] });

export const metadata: Metadata = {
  title: 'متجر المكافآت',
  description: 'احصل على رصيد مجاني عن طريق تخطي الروابط',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${tajawal.className} bg-slate-50 text-slate-900 antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster theme="light" position="bottom-center" dir="rtl" />
        </AuthProvider>
      </body>
    </html>
  );
}
