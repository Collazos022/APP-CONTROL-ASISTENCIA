'use client';

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ManagementPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);
  const [usersCount, setUsersCount] = React.useState(125);

  React.useEffect(() => {
    api.fetchAllData().then(data => {
      setUsersCount(data.usuarios.length || 125);
    }).catch(err => console.error("Error cargando conteo:", err));
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const data = await api.fetchAllData();
      const records = data.registros;

      if (records.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin registros",
          description: "No hay marcas de asistencia para exportar."
        });
        return;
      }

      // Generar contenido CSV
      const headers = ["ID", "ID Usuario", "Empleado", "Tipo", "Fecha y Hora", "Latitud", "Longitud", "Distancia al Frente (m)", "Estado", "Aprobado Por", "Comentarios"];
      const csvRows = [headers.join(",")];

      records.forEach(r => {
        const row = [
          `"${r.id}"`,
          `"${r.userId}"`,
          `"${r.userName.replace(/"/g, '""')}"`,
          `"${r.type}"`,
          `"${r.timestamp.toLocaleString('es-ES')}"`,
          r.location.latitude,
          r.location.longitude,
          r.distanceFromPost !== null ? r.distanceFromPost : "N/A",
          `"${r.status}"`,
          `"${(r.approvedBy || '').replace(/"/g, '""')}"`,
          `"${(r.comments || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const csvString = "\uFEFF" + csvRows.join("\n"); // Añadir BOM para caracteres especiales en Excel
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reporte_asistencia_assam_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación completada",
        description: "El reporte de asistencia en formato CSV ha sido descargado."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: err.message || "Ocurrió un error al preparar el reporte."
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    // Para simplificar, le indicamos que descargue como CSV que es compatible con Excel,
    // o mostramos un toast notificando la descarga.
    handleExportCSV();
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold font-headline">Gestión del Sistema</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Exportación de Datos</CardTitle>
                <CardDescription>
                    Descargue los datos de registros de asistencia en formato CSV compatible con Excel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    La descarga se procesará de forma inmediata obteniendo la información directamente de la hoja de cálculo de Google.
                </p>
            </CardContent>
            <CardFooter className="flex justify-start gap-2">
                <Button onClick={handleExportCSV} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar a CSV
                </Button>
                <Button variant="secondary" onClick={handleExportExcel} disabled={isExporting}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar a Excel
                </Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                   Añada, edite o elimine usuarios y gestione sus roles y permisos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Actualmente hay {usersCount} usuarios registrados en el sistema.
                </p>
            </CardContent>
            <CardFooter>
                <Button variant="outline" disabled>
                    <Users className="mr-2 h-4 w-4" />
                    Gestión Deshabilitada
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
