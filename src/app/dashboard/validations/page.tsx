
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const cargos = [
    "Gerente", "Coordinador", "RRHH", "Supervisor Op", "Supervisor HSE",
    "Ingeniero Op", "Soldador API", "Tubero 1", "Auxiliar Soldadura", "Obrero"
];

const frentes = ["Frente A", "Frente B", "Taller", "Oficina"];
const roles = ["Administrador", "Editor", "Aprobador", "Empleado"];

export default function ValidationsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tablas de Validación</CardTitle>
          <CardDescription>
            Estos son los valores utilizados en las listas desplegables de la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cargos">
            <TabsList>
              <TabsTrigger value="cargos">Cargos</TabsTrigger>
              <TabsTrigger value="frentes">Frentes</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>
            <TabsContent value="cargos">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Cargo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargos.map((cargo) => (
                    <TableRow key={cargo}>
                      <TableCell>{cargo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="frentes">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Frente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frentes.map((frente) => (
                    <TableRow key={frente}>
                      <TableCell>{frente}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="roles">
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Rol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((rol) => (
                    <TableRow key={rol}>
                      <TableCell>{rol}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
