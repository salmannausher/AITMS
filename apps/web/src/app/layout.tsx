import type { Metadata } from 'next';
import './globals.css';
import { getSessionUser } from '@/lib/auth/session';
import { SessionProvider } from '@/components/auth/SessionProvider';

export const metadata: Metadata = {
  title: 'Devsphinx AI Dispatch',
  description: 'AI-powered Transportation Management System',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <SessionProvider user={user}>{children}</SessionProvider>
      </body>
    </html>
  );
}
