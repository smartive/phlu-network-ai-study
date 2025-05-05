import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NavigationGuard } from '@/components/NavigationGuard';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Network. - PH Luzern',
  description: 'Network. - PH Luzern Research Chatbot',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} antialiased`}>
        <NavigationGuard />
        <div className="p-4 max-w-6xl mx-auto">{children}</div>
      </body>
    </html>
  );
}
