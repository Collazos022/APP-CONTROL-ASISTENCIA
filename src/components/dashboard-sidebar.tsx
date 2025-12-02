
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { type Role } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrador', 'Aprobador', 'Editor', 'Empleado'] },
  { href: '/dashboard/records', label: 'Registros', icon: ClipboardList, roles: ['Administrador', 'Aprobador', 'Editor'] },
  { href: '/dashboard/management', label: 'Gestión', icon: Users, roles: ['Administrador'] },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = React.useState<Role>('Empleado');

  React.useEffect(() => {
    const role = localStorage.getItem('userRole') as Role;
    if (role) {
      setUserRole(role);
    }
  }, []);
  
  const accessibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="#"
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
                    pathname === item.href
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
              <Link
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
