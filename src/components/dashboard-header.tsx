
'use client';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PanelLeft,
  LayoutDashboard,
  ClipboardList,
  Users,
  Building,
  User,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import * as React from 'react';
import { type Role } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { navItems } from './dashboard-sidebar';

export function DashboardHeader() {
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const userAvatar = placeholderImages.find(p => p.id === 'avatar-1');

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

  const accessibleMobileNavItems = userRole ? navItems.filter(item => item.roles.includes(userRole)) : [];

  const roleNames: Role[] = ['Empleado', 'Aprobador', 'Editor', 'Administrador'];
  const changeRole = (newRole: Role) => {
    localStorage.setItem('userRole', newRole);
    setUserRole(newRole);
    window.location.reload();
  };

  if (!userRole) {
    return (
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        {/* Placeholder or loading state */}
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Building className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">ASSAM</span>
            </Link>
            {accessibleMobileNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
             <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                Cerrar Sesión
              </button>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h1 className="font-semibold text-lg font-headline">Panel de {userRole}</h1>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Cambiar Rol (Demo)
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Seleccionar Rol</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roleNames.map(role => (
              <DropdownMenuItem key={role} onSelect={() => changeRole(role)}>
                {role}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
            onClick={() => router.push('/dashboard/profile')}
          >
            <Avatar>
              <AvatarImage src={userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
              <AvatarFallback>{/* Can be user initials */}</AvatarFallback>
            </Avatar>
        </Button>
      </div>
    </header>
  );
}
