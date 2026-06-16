'use client';

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { type User, type Role } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<User[]>([]);
  const [originalUsers, setOriginalUsers] = React.useState<User[]>([]);
  const [cargos, setCargos] = React.useState<{ name: string; role: Role }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    api.fetchAllData().then(data => {
      setUsers(data.usuarios);
      setOriginalUsers(JSON.parse(JSON.stringify(data.usuarios)));
      setCargos(data.cargos);
    }).catch(err => {
      console.error("Error loading users:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleCargoChange = (userEmail: string, newCargo: string) => {
    const matchingCargo = cargos.find(c => c.name.toLowerCase() === newCargo.toLowerCase());
    const newRole = matchingCargo ? matchingCargo.role : "Empleado";

    setUsers(prev => prev.map(u => 
      u.email === userEmail ? { ...u, cargo: newCargo, role: newRole } : u
    ));
  };

  const handleEstadoChange = (userEmail: string, newEstado: string) => {
    setUsers(prev => prev.map(u => 
      u.email === userEmail ? { ...u, estado: newEstado } : u
    ));
  };

  const hasChanges = React.useMemo(() => {
    return JSON.stringify(users) !== JSON.stringify(originalUsers);
  }, [users, originalUsers]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const changedUsers = users.filter(u => {
        const orig = originalUsers.find(ou => ou.email === u.email);
        return !orig || orig.cargo !== u.cargo || orig.role !== u.role || orig.estado !== u.estado;
      }).map(u => ({
        id: u.email,
        cargo: u.cargo || "",
        role: u.role,
        estado: u.estado || "Activo"
      }));

      if (changedUsers.length > 0) {
        await api.updateUsers(changedUsers);
        setOriginalUsers(JSON.parse(JSON.stringify(users)));
        toast({
          title: "Cambios Guardados",
          description: "Los datos de los usuarios se han sincronizado con Google Sheets.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al Guardar",
        description: err.message || "No se pudieron guardar los cambios.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener la lista única de cargos disponibles
  const cargoOptions = React.useMemo(() => {
    const options = cargos.map(c => c.name);
    users.forEach(u => {
      if (u.cargo && !options.includes(u.cargo)) {
        options.push(u.cargo);
      }
    });
    return options;
  }, [cargos, users]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>Lista de todos los usuarios registrados en el sistema.</CardDescription>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="w-full sm:w-auto bg-primary text-white hover:opacity-90 rounded-xl text-xs font-bold h-10 px-6 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar Cambios
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Identificación</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Huella</TableHead>
                <TableHead className="w-[180px]">Cargo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const avatarSrc = user.avatar?.startsWith("data:") || user.avatar?.startsWith("http")
                  ? user.avatar
                  : placeholderImages.find(p => p.id === user.avatar)?.imageUrl;

                const hasHuella = user.huellaRegistrada?.toUpperCase() === "SI";

                return (
                  <TableRow key={user.email} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={avatarSrc} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-800">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{user.identificacion || "-"}</TableCell>
                    <TableCell className="text-slate-600">{user.telefono || "-"}</TableCell>
                    <TableCell>
                      {hasHuella ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100/80 rounded-full font-bold">
                          Registrada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-200 rounded-full font-bold">
                          Sin Huella
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.cargo || "ninguno"}
                        onValueChange={(val) => handleCargoChange(user.email, val === "ninguno" ? "" : val)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full bg-white/70 border-slate-200 rounded-xl shadow-sm text-xs h-9">
                          <SelectValue placeholder="Seleccionar cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ninguno" className="text-xs">-</SelectItem>
                          {cargoOptions.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Administrador' ? 'default' : 'secondary'} className="rounded-full font-bold">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.estado || "Activo"}
                        onValueChange={(val) => handleEstadoChange(user.email, val)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-full bg-white/70 border-slate-200 rounded-xl shadow-sm text-xs h-9">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo" className="text-xs">Activo</SelectItem>
                          <SelectItem value="Inactivo" className="text-xs">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
