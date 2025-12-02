'use client';
import * as React from 'react';
import { type Role } from '@/lib/types';
import EmployeeDashboard from '@/components/employee-dashboard';
import AdminDashboard from '@/components/admin-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [userRole, setUserRole] = React.useState<Role | null>(null);

  React.useEffect(() => {
    const role = localStorage.getItem('userRole') as Role;
    setUserRole(role || 'Empleado');
  }, []);

  if (!userRole) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'Empleado':
        return <EmployeeDashboard />;
      case 'Administrador':
      case 'Aprobador':
      case 'Editor':
        return <AdminDashboard role={userRole} />;
      default:
        return <div>Rol no reconocido.</div>;
    }
  };

  return <div>{renderDashboard()}</div>;
}
