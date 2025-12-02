import * as React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <DashboardSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <DashboardHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
