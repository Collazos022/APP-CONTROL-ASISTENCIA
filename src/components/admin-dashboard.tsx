import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  User,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { type Role, type CheckInRecord } from "@/lib/types";
import { MOCK_RECORDS } from "@/lib/mock-data";
import { placeholderImages } from "@/lib/placeholder-images";

interface AdminDashboardProps {
  role: Role;
}

const recentActivities = MOCK_RECORDS.slice(0, 5);

export default function AdminDashboard({ role }: AdminDashboardProps) {
    const pendingRecordsCount = MOCK_RECORDS.filter(r => r.status === 'Pendiente').length;
    const approvedTodayCount = MOCK_RECORDS.filter(r => r.status === 'Aprobado' && r.timestamp.toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Registros Pendientes
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRecordsCount}</div>
            <p className="text-xs text-muted-foreground">
              Para revisión y aprobación
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aprobados Hoy
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{approvedTodayCount}</div>
            <p className="text-xs text-muted-foreground">
              Desde la última medianoche
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div>
            <p className="text-xs text-muted-foreground">
              Activos en el sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad General</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              Registros en la última semana
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimos 5 registros en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={placeholderImages.find(p => p.id === activity.userAvatar)?.imageUrl} alt="Avatar" />
                  <AvatarFallback>{activity.userName.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.userName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Marcó {activity.type.toLowerCase()} - {activity.status}
                  </p>
                </div>
                <div className="ml-auto font-medium">{activity.timestamp.toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
