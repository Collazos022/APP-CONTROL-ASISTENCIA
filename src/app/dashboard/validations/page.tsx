'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { type Role } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { navItems } from '@/components/dashboard-sidebar';

const initialCargos = [
  { name: 'Gerente', role: 'Administrador' as Role },
  { name: 'Coordinador', role: 'Aprobador' as Role },
  { name: 'RRHH', role: 'Editor' as Role },
  { name: 'Supervisor Op', role: 'Aprobador' as Role },
  { name: 'Supervisor HSE', role: 'Aprobador' as Role },
  { name: 'Ingeniero Op', role: 'Empleado' as Role },
  { name: 'Soldador API', role: 'Empleado' as Role },
  { name: 'Tubero 1', role: 'Empleado' as Role },
  { name: 'Auxiliar Soldadura', role: 'Empleado' as Role },
  { name: 'Obrero', role: 'Empleado' as Role },
];

const initialFrentes = [
  { name: 'Frente A', lat: '4.60971', lon: '-74.08175' },
  { name: 'Frente B', lat: '3.451647', lon: '-76.531982' },
  { name: 'Taller', lat: '6.244203', lon: '-75.581215' },
  { name: 'Oficina', lat: '4.624335', lon: '-74.063644' },
];

const allRoles: Role[] = ['Administrador', 'Editor', 'Aprobador', 'Empleado'];

export default function ValidationsPage() {
  const { toast } = useToast();
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [cargos, setCargos] = React.useState(initialCargos);
  const [frentes, setFrentes] = React.useState(initialFrentes);
  
  const isAdmin = userRole === 'Administrador';

  React.useEffect(() => {
    const role = localStorage.getItem('userRole') as Role;
    setUserRole(role);
  }, []);

  const handleCargoRoleChange = (cargoName: string, newRole: Role) => {
    setCargos(
      cargos.map((cargo) =>
        cargo.name === cargoName ? { ...cargo, role: newRole } : cargo
      )
    );
  };

  const handleFrenteCoordChange = (
    frenteName: string,
    coord: 'lat' | 'lon',
    value: string
  ) => {
    setFrentes(
      frentes.map((frente) =>
        frente.name === frenteName ? { ...frente, [coord]: value } : frente
      )
    );
  };
  
  const handleSaveChanges = (section: string) => {
    // En una app real, aquí se haría la llamada a la API para guardar los datos.
    console.log(`Guardando cambios en ${section}:`, { cargos, frentes });
    toast({
      title: 'Cambios Guardados',
      description: `Los datos de ${section} han sido actualizados.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tablas de Validación</CardTitle>
        <CardDescription>
          Gestione los valores utilizados en la aplicación. Solo los
          administradores pueden editar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cargos">
          <TabsList className="mb-4">
            <TabsTrigger value="cargos">Cargos y Roles</TabsTrigger>
            <TabsTrigger value="frentes">Frentes de Trabajo</TabsTrigger>
            <TabsTrigger value="roles">Permisos por Rol</TabsTrigger>
          </TabsList>

          {/* TABLA DE CARGOS */}
          <TabsContent value="cargos">
            <Card>
              <CardHeader>
                 <CardTitle>Asociación de Cargos y Roles</CardTitle>
                 <CardDescription>Asigne un rol a cada cargo para definir sus permisos.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="w-[250px]">Rol Asignado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargos.map((cargo) => (
                      <TableRow key={cargo.name}>
                        <TableCell className="font-medium">{cargo.name}</TableCell>
                        <TableCell>
                          <Select
                            value={cargo.role}
                            onValueChange={(value) => handleCargoRoleChange(cargo.name, value as Role)}
                            disabled={!isAdmin}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {allRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {isAdmin && (
                    <div className="flex justify-end mt-4">
                        <Button onClick={() => handleSaveChanges('Cargos')}>Guardar Cambios</Button>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TABLA DE FRENTES */}
          <TabsContent value="frentes">
            <Card>
                 <CardHeader>
                    <CardTitle>Frentes de Trabajo y Coordenadas</CardTitle>
                    <CardDescription>Defina la ubicación de cada frente para la validación de registros.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Frente</TableHead>
                        <TableHead>Latitud</TableHead>
                        <TableHead>Longitud</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {frentes.map((frente) => (
                        <TableRow key={frente.name}>
                            <TableCell className="font-medium">{frente.name}</TableCell>
                            <TableCell>
                            <Input
                                value={frente.lat}
                                onChange={(e) => handleFrenteCoordChange(frente.name, 'lat', e.target.value)}
                                disabled={!isAdmin}
                                placeholder="Ej: 4.60971"
                            />
                            </TableCell>
                            <TableCell>
                            <Input
                                value={frente.lon}
                                onChange={(e) => handleFrenteCoordChange(frente.name, 'lon', e.target.value)}
                                disabled={!isAdmin}
                                placeholder="Ej: -74.08175"
                            />
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                     {isAdmin && (
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => handleSaveChanges('Frentes')}>Guardar Cambios</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
          
          {/* TABLA DE ROLES */}
          <TabsContent value="roles">
            <Card>
                <CardHeader>
                    <CardTitle>Permisos del Sistema por Rol</CardTitle>
                    <CardDescription>Visualice las pestañas a las que cada rol tiene acceso.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pestaña</TableHead>
                                {allRoles.map(role => <TableHead key={role} className="text-center">{role}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {navItems.map(item => (
                                <TableRow key={item.href}>
                                    <TableCell className="font-medium">{item.label}</TableCell>
                                    {allRoles.map(role => (
                                        <TableCell key={`${item.href}-${role}`} className="text-center">
                                            <div className="flex justify-center">
                                                <Checkbox
                                                    checked={item.roles.includes(role)}
                                                    disabled
                                                />
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
