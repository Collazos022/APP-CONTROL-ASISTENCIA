
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
  const [userName, setUserName] = React.useState<string | null>(null);
  const userAvatar = placeholderImages.find(p => p.id === 'avatar-1');

  React.useEffect(() => {
    const role = localStorage.getItem('userRole') as Role;
    const name = localStorage.getItem('userName');
    if (role) {
      setUserRole(role);
      setUserName(name);
    } else {
      router.push('/');
    }
  }, [router]);
  
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    router.push('/');
  };

  const accessibleMobileNavItems = userRole ? navItems.filter(item => item.roles.includes(userRole)) : [];

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
        {/* Title removed as requested */}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <span className="font-semibold text-sm hidden sm:inline">{userName || 'Usuario'} ({userRole})</span>
        </div>

        <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
            onClick={() => router.push('/dashboard/profile')}
          >
            <Avatar>
              <AvatarImage src={userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
              <AvatarFallback>{userName?.substring(0,2) || 'U'}</AvatarFallback>
            </Avatar>
        </Button>
      </div>
    </header>
  );
}
