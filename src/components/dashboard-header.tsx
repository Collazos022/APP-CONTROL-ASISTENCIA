'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { type Role } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export function DashboardHeader() {
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);

  const fetchUserData = React.useCallback(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem('userRole') as Role;
      const name = localStorage.getItem('userName');
      const avatar = localStorage.getItem('userAvatar');
      
      if (role) {
        setUserRole(role);
        setUserName(name);
        setUserAvatar(avatar);
      } else {
        router.push('/');
      }
    }
  }, [router]);

  React.useEffect(() => {
    fetchUserData();
    
    // Escuchar el evento personalizado de actualización
    window.addEventListener("refresh-header", fetchUserData);
    return () => {
      window.removeEventListener("refresh-header", fetchUserData);
    };
  }, [fetchUserData]);

  if (!userRole) {
    return (
      <header className="sticky top-0 z-40 w-full bg-surface-glass backdrop-blur-md border-b border-white/20 shadow-sm flex items-center justify-between px-4 h-16" />
    );
  }

  // Resolver la URL del avatar del empleado
  let avatarSrc = "";
  if (userAvatar) {
    if (userAvatar.startsWith("http://") || userAvatar.startsWith("https://") || userAvatar.startsWith("data:")) {
      avatarSrc = userAvatar;
    } else {
      const matched = placeholderImages.find(p => p.id === userAvatar);
      avatarSrc = matched ? matched.imageUrl : "";
    }
  }

  // Obtener el apellido o primer nombre corto para mostrar al lado del avatar
  const shortName = userName ? userName.split(" ")[0] : "Usuario";

  return (
    <header className="sticky top-0 z-40 w-full bg-surface-glass backdrop-blur-md border-b border-white/20 shadow-sm flex items-center justify-between px-4 lg:px-6 h-16">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
        <div className="h-8 w-auto flex items-center">
          <Image 
            src="/logo.svg" 
            alt="Logo Institucional ASSAM" 
            width={120} 
            height={32} 
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-body-sm font-medium text-on-surface hidden sm:inline-block">
          {shortName}
        </span>
        <div 
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => router.push('/dashboard/profile')}
        >
          <Avatar className="h-full w-full">
            {avatarSrc ? (
              <AvatarImage src={avatarSrc} alt={userName || "Avatar"} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {userName?.substring(0, 2).toUpperCase() || "US"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
