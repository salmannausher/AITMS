import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { Toaster } from '@/components/ui/toaster';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
