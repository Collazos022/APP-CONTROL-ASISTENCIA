'use client';
import * as React from 'react';
import { type Role } from '@/lib/types';
import EmployeeDashboard from '@/components/employee-dashboard';
import AdminDashboard from '@/components/admin-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [userRole, setUserRole] = React.useState<Role | null>(null);

  React.useEffect(() => {
    const rawRole = localStorage.getItem('userRole') || 'Empleado';
    const role = rawRole.trim() as Role;
    setUserRole(role);
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
      case 'Supervisor':
        return <AdminDashboard role={userRole} />;
      default:
        return (
          <div className="p-8 text-center text-slate-500">
            Rol no reconocido: "{userRole}". Por favor contacte a soporte si cree que esto es un error.
          </div>
        );
    }
  };

  return <div>{renderDashboard()}</div>;
}
