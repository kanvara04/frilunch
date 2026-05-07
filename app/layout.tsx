import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cold Chain Monitoring | ระบบติดตามตู้แช่',
  description: 'Real-time temperature monitoring for cold chain SME',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={sarabun.className}>{children}</body>
    </html>
  );
}
