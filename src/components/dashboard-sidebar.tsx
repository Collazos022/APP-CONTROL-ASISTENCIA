'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { type Role } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  icon: string; // Nombre del icono de Material Symbols
  roles: Role[];
}

export const navItems: NavItem[] = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: 'space_dashboard', roles: ['Administrador', 'Aprobador', 'Editor'] },
  { href: '/dashboard', label: 'Turno', icon: 'schedule', roles: ['Administrador', 'Aprobador', 'Editor', 'Empleado'] },
  { href: '/dashboard/records', label: 'Histórico', icon: 'history', roles: ['Administrador', 'Aprobador', 'Editor', 'Empleado'] },
  { href: '/dashboard/approvals', label: 'Aprobaciones', icon: 'fact_check', roles: ['Administrador', 'Aprobador', 'Editor'] },
  { href: '/dashboard/users', label: 'Usuarios', icon: 'group', roles: ['Administrador'] },
  { href: '/dashboard/validations', label: 'Validaciones', icon: 'settings', roles: ['Administrador'] },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<Role | null>(null);

  React.useEffect(() => {
    const role = localStorage.getItem('userRole') as Role;
    if (role) {
      setUserRole(role);
    } else {
      router.push('/');
    }
  }, [router]);
  
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userAvatar');
    router.push('/');
  };

  if (!userRole) {
    return (
      <>
        {/* Loading state placeholders */}
        <aside className="fixed inset-y-0 right-0 z-10 hidden w-16 flex-col border-l bg-background/80 backdrop-blur-md lg:flex" />
        <nav className="fixed bottom-0 left-0 w-full z-50 flex h-16 border-t bg-background/80 backdrop-blur-md lg:hidden" />
      </>
    );
  }

  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* 1. VISTA DE ESCRITORIO: BARRA LATERAL DERECHA */}
      <aside className="fixed inset-y-0 right-0 z-10 hidden w-16 flex-col border-l bg-surface-glass backdrop-blur-md border-white/20 shadow-lg lg:flex items-center py-5 justify-between">
        <TooltipProvider>
          <div className="flex flex-col items-center gap-6">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">corporate_fare</span>
            </Link>
            
            <nav className="flex flex-col items-center gap-4">
              {accessibleNavItems.map((item) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/dashboard/admin');
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-95",
                          isActive
                            ? 'bg-primary-fixed/30 text-primary font-bold'
                            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                        )}
                      >
                        <span className={cn(
                          "material-symbols-outlined text-[24px]",
                          isActive && "filled-icon"
                        )} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                          {item.icon}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="left">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-error hover:bg-error-container hover:text-on-error-container transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[24px]">logout</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">Cerrar Sesión</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </aside>

      {/* 2. VISTA MÓVIL: MENÚ DE NAVEGACIÓN INFERIOR (BOTTOM NAV) */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 pb-safe bg-surface-glass backdrop-blur-lg border-t border-white/20 shadow-lg h-16">
        {accessibleNavItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== '/dashboard/admin');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl transition-all w-12 h-12 active-tap",
                isActive
                  ? 'text-primary bg-primary-fixed/30'
                  : 'text-on-surface-variant hover:text-primary'
              )}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center text-error w-12 h-12 active-tap"
        >
          <span className="material-symbols-outlined text-[24px]">logout</span>
        </button>
      </nav>
    </>
  );
}
