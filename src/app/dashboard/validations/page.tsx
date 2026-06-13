'use client';

import * as React from 'react';
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
import { defaultNavItems, type NavItem } from '@/components/dashboard-sidebar';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

const allRoles: Role[] = ['Administrador', 'Editor', 'Aprobador', 'Empleado'];

export default function ValidationsPage() {
  const { toast } = useToast();
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [cargos, setCargos] = React.useState<{ name: string; role: Role }[]>([]);
  const [frentes, setFrentes] = React.useState<{ name: string; coords: string; radio: number }[]>([]);
  const [permissions, setPermissions] = React.useState<NavItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const isAdmin = userRole === 'Administrador';

  React.useEffect(() => {
    const role = localStorage.getItem('userRole') as Role;
    setUserRole(role);

    api.fetchAllData().then(data => {
      setCargos(data.cargos);
      setFrentes(data.frentes);
      
      if (data.permisos && data.permisos.length > 0) {
        const dynamicNavItems = defaultNavItems.map(item => {
           const perm = data.permisos.find((p: any) => p.label === item.label);
           if (perm) {
              return { ...item, roles: perm.roles };
           }
           return item;
        });
        setPermissions(dynamicNavItems);
      } else {
        // deep copy defaultNavItems to avoid mutating constants
        setPermissions(defaultNavItems.map(item => ({ ...item, roles: [...item.roles] })));
      }
    }).catch(err => {
      console.error("Error loading validations config:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleCargoRoleChange = (cargoName: string, newRole: Role) => {
    setCargos(
      cargos.map((cargo) =>
        cargo.name === cargoName ? { ...cargo, role: newRole } : cargo
      )
    );
  };

  const handleFrenteCoordChange = (index: number, value: string) => {
    const newFrentes = [...frentes];
    newFrentes[index].coords = value;
    setFrentes(newFrentes);
  };

  const handleFrenteNameChange = (index: number, value: string) => {
    const newFrentes = [...frentes];
    newFrentes[index].name = value;
    setFrentes(newFrentes);
  };

  const handleFrenteRadioChange = (index: number, value: string) => {
    const newFrentes = [...frentes];
    newFrentes[index].radio = parseFloat(value) || 1;
    setFrentes(newFrentes);
  };

  const handleAddFrente = () => {
    setFrentes([...frentes, { name: '', coords: '', radio: 1 }]);
  };

  const handleDeleteFrente = (index: number) => {
    const newFrentes = [...frentes];
    newFrentes.splice(index, 1);
    setFrentes(newFrentes);
  };
  
  const handleTogglePermission = (label: string, role: Role) => {
    setPermissions(prev => prev.map(item => {
      if (item.label === label) {
        const hasRole = item.roles.includes(role);
        let newRoles = [...item.roles];
        if (hasRole) {
          newRoles = newRoles.filter(r => r !== role);
        } else {
          newRoles.push(role);
        }
        return { ...item, roles: newRoles };
      }
      return item;
    }));
  };
  
  const handleSaveChanges = async (section: string) => {
    setIsSaving(true);
    try {
      if (section === 'Cargos') {
        await api.updateCargos(cargos);
      } else if (section === 'Frentes') {
        await api.updateFrentes(frentes);
      } else if (section === 'Permisos') {
        await api.updatePermisos(permissions.map(p => ({ label: p.label, roles: p.roles })));
      }
      toast({
        title: 'Cambios Guardados',
        description: `Los datos de ${section} han sido actualizados en Google Sheets.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: 'Error al Guardar',
        description: err.message || 'No se pudo guardar la configuración.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pt-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Title */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold font-headline text-primary">Tablas de Validación</h1>
        <p className="text-sm text-on-surface-variant leading-tight">
          Gestione los cargos y frentes de trabajo referenciados en el control de asistencia.
        </p>
      </section>

      <div className="w-full">
        <Tabs defaultValue="cargos" className="w-full space-y-4">
          <TabsList className="bg-surface-container-low p-1 rounded-2xl border border-outline-variant/30 w-full sm:w-auto">
            <TabsTrigger value="cargos" className="rounded-xl text-xs font-bold px-4 py-2">
              Cargos y Roles
            </TabsTrigger>
            <TabsTrigger value="frentes" className="rounded-xl text-xs font-bold px-4 py-2">
              Frentes de Trabajo
            </TabsTrigger>
            <TabsTrigger value="roles" className="rounded-xl text-xs font-bold px-4 py-2">
              Matriz de Permisos
            </TabsTrigger>
          </TabsList>

          {/* TABLA DE CARGOS */}
          <TabsContent value="cargos" className="focus-visible:outline-none">
            <div className="glass-card rounded-3xl p-6 border border-white/20 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-on-surface-variant uppercase font-bold">
                      <th className="py-3 px-4">Cargo</th>
                      <th className="py-3 px-4 w-[250px]">Rol en Aplicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cargos.map((cargo) => (
                      <tr key={cargo.name} className="hover:bg-white/10 transition-colors">
                        <td className="py-3 px-4 font-bold text-on-surface">{cargo.name}</td>
                        <td className="py-2 px-4">
                          <Select
                            value={cargo.role}
                            onValueChange={(value) => handleCargoRoleChange(cargo.name, value as Role)}
                            disabled={!isAdmin || isSaving}
                          >
                            <SelectTrigger className="w-full bg-white/70 border-white/20 rounded-xl shadow-sm text-xs h-9">
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {allRoles.map((role) => (
                                <SelectItem key={role} value={role} className="text-xs">
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-3">
                  <Button 
                    onClick={() => handleSaveChanges('Cargos')} 
                    disabled={isSaving}
                    className="bg-primary text-white hover:opacity-90 rounded-xl text-xs font-bold h-10 px-6 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    Guardar Cargos
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TABLA DE FRENTES */}
          <TabsContent value="frentes" className="focus-visible:outline-none">
            <div className="glass-card rounded-3xl p-6 border border-white/20 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-on-surface-variant uppercase font-bold">
                      <th className="py-3 px-4">Frente</th>
                      <th className="py-3 px-4">Coordenadas (Lat, Lon)</th>
                      <th className="py-3 px-4 w-[120px]">Radio (metros)</th>
                      {isAdmin && <th className="py-3 px-4 w-[60px]"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {frentes.map((frente, index) => (
                      <tr key={index} className="hover:bg-white/10 transition-colors">
                        <td className="py-3 px-4">
                          <Input
                            value={frente.name}
                            onChange={(e) => handleFrenteNameChange(index, e.target.value)}
                            disabled={!isAdmin || isSaving}
                            placeholder="Nombre del frente"
                            className="bg-transparent border-none focus-visible:ring-0 px-0 h-auto font-bold text-on-surface shadow-none"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={frente.coords}
                            onChange={(e) => handleFrenteCoordChange(index, e.target.value)}
                            disabled={!isAdmin || isSaving}
                            placeholder="Ej: 4.60971, -74.08175"
                            className="bg-white/70 border border-white/20 rounded-xl text-xs h-9 focus:ring-primary focus:ring-1 w-full"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            type="number"
                            step="0.1"
                            value={frente.radio}
                            onChange={(e) => handleFrenteRadioChange(index, e.target.value)}
                            disabled={!isAdmin || isSaving}
                            className="bg-surface-container/40 px-3 py-2 rounded-xl text-xs text-on-surface-variant font-bold border border-white/10 select-none text-center focus:ring-primary focus:ring-1"
                          />
                        </td>
                        {isAdmin && (
                          <td className="py-2 px-4 text-center">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleDeleteFrente(index)}
                              className="text-error/70 hover:text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors"
                              title="Eliminar Frente"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isAdmin && (
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <Button 
                    variant="outline"
                    onClick={handleAddFrente} 
                    disabled={isSaving}
                    className="border-primary text-primary hover:bg-primary/10 rounded-xl text-xs font-bold h-9 px-4 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Agregar Nuevo Frente
                  </Button>
                  
                  <Button 
                    onClick={() => handleSaveChanges('Frentes')} 
                    disabled={isSaving}
                    className="bg-primary text-white hover:opacity-90 rounded-xl text-xs font-bold h-10 px-6 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    Guardar Frentes
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* TABLA DE ROLES */}
          <TabsContent value="roles" className="focus-visible:outline-none">
            <div className="glass-card rounded-3xl p-6 border border-white/20 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-on-surface-variant uppercase font-bold">
                      <th className="py-3 px-4">Pestaña / Módulo</th>
                      {allRoles.map(role => (
                        <th key={role} className="py-3 px-4 text-center">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {permissions.map(item => (
                      <tr key={item.label} className="hover:bg-white/10 transition-colors">
                        <td className="py-3 px-4 font-bold text-on-surface">{item.label}</td>
                        {allRoles.map(role => (
                          <td key={`${item.label}-${role}`} className="py-2 px-4">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={item.roles.includes(role)}
                                onCheckedChange={() => handleTogglePermission(item.label, role)}
                                disabled={!isAdmin || isSaving}
                                className="w-4 h-4 rounded border-slate-300 text-primary data-[state=checked]:bg-primary data-[state=checked]:text-on-primary shrink-0 opacity-70"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {isAdmin && (
                <div className="flex justify-end pt-3 border-t border-white/10">
                  <Button 
                    onClick={() => handleSaveChanges('Permisos')} 
                    disabled={isSaving}
                    className="bg-primary text-white hover:opacity-90 rounded-xl text-xs font-bold h-10 px-6 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                    Guardar Permisos
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
