import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <Toaster />
    </div>
  );
}
