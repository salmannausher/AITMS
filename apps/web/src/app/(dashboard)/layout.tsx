import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar: hidden on mobile, visible lg+ */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      {/* Bottom nav: visible on mobile/tablet only */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      <Toaster />
    </div>
  );
}
