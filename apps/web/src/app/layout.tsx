import type { Metadata } from 'next';
import { Hanken_Grotesk, JetBrains_Mono, Inter } from 'next/font/google';
import './globals.css';
import { getSessionUser } from '@/lib/auth/session';
import { SessionProvider } from '@/components/auth/SessionProvider';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Devsphinx AI Dispatch',
  description: 'AI-powered Transportation Management System',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${hanken.variable} ${jetbrains.variable} ${inter.variable}`}>
      <body>
        <SessionProvider user={user}>{children}</SessionProvider>
      </body>
    </html>
  );
}
