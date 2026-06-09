import * as React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-surface-bright">
      <DashboardSidebar />
      {/* 
        - pb-20 en móvil para evitar que la barra de navegación inferior tape el contenido.
        - lg:pr-16 en escritorio para respetar el espacio de la barra lateral derecha.
        - lg:pb-0 en escritorio ya que no hay barra inferior.
      */}
      <div className="flex flex-col gap-4 pb-20 lg:pb-4 lg:pr-16">
        <DashboardHeader />
        <main className="grid flex-grow items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
