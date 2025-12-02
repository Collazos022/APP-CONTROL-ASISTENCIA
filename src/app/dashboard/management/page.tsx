import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function DataExportCard() {
    // const { toast } = useToast(); // This is a server component, can't use hooks
    const handleExport = (format: 'CSV' | 'Excel') => {
        console.log(`Exporting to ${format}`);
        // In a real app, this would trigger a server-side process
        // For demo, we can just show a toast, but this needs to be a client component
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Exportación de Datos</CardTitle>
                <CardDescription>
                    Descargue los datos de usuarios y registros en formato CSV o Excel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    La exportación puede tardar unos minutos dependiendo de la cantidad de datos. Se le notificará cuando el archivo esté listo para descargar.
                </p>
            </CardContent>
            <CardFooter className="flex justify-start gap-2">
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar a CSV
                </Button>
                <Button variant="secondary">
                     <Download className="mr-2 h-4 w-4" />
                    Exportar a Excel
                </Button>
            </CardFooter>
        </Card>
    );
}


function UserManagementCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                   Añada, edite o elimine usuarios y gestione sus roles y permisos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Actualmente hay 125 usuarios activos en el sistema.
                </p>
            </CardContent>
            <CardFooter>
                <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Gestionar Usuarios
                </Button>
            </CardFooter>
        </Card>
    )
}


export default function ManagementPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold font-headline">Gestión del Sistema</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <DataExportCard />
        <UserManagementCard />
      </div>
    </div>
  );
}
