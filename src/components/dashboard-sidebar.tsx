
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  Building,
  CheckSquare,
  FileText,
  User,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { type Role } from '@/lib/types';
import { Button } from './ui/button';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  isBottom?: boolean;
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Aprobador', 'Editor', 'Empleado'] },
  { href: '/dashboard/profile', label: 'Mi Perfil', icon: User, roles: ['Administrador', 'Aprobador', 'Editor', 'Empleado'] },
  { href: '/dashboard/records', label: 'Mis Registros', icon: FileText, roles: ['Empleado'] },
  { href: '/dashboard/approvals', label: 'Aprobaciones', icon: ClipboardList, roles: ['Administrador', 'Aprobador', 'Editor'] },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, roles: ['Administrador'] },
  { href: '/dashboard/validations', label: 'Validaciones', icon: CheckSquare, roles: ['Administrador'] },
  { href: '/dashboard/management', label: 'Gestión General', icon: Settings, roles: ['Administrador'] },
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
    router.push('/');
  };

  if (!userRole) {
    return (
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        {/* Skeleton or loading state */}
      </aside>
    );
  }

  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Building className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">ASSAM</span>
          </Link>
          {accessibleNavItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                    (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard'))
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Cerrar Sesión</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Cerrar Sesión</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
