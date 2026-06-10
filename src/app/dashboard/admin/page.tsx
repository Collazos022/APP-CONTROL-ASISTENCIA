'use client';
import * as React from 'react';
import { type Role } from '@/lib/types';
import AdminDashboard from '@/components/admin-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const rawRole = localStorage.getItem('userRole');
    if (!rawRole) {
      router.push('/');
      return;
    }
    const role = rawRole.trim() as Role;
    if (role === 'Empleado') {
      router.push('/dashboard');
    } else {
      setUserRole(role);
    }
  }, [router]);

  if (!userRole) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return <AdminDashboard role={userRole} />;
}
