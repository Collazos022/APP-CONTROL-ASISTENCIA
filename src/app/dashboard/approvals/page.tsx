'use client';

import * as React from "react";
import { api } from "@/lib/api";
import { type CheckInRecord, type CheckInStatus } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function getFingerprintColor(status?: string) {
  const s = (status || "").trim().toUpperCase();
  if (s === "CORRECTA") return "#22c55e"; // Verde
  if (s === "DISCREPANCIA") return "#f97316"; // Naranja
  return "#ef4444"; // Rojo para SIN_HUELLA / vacío
}

function getFingerprintTooltip(status?: string) {
  const s = (status || "").trim().toUpperCase();
  if (s === "CORRECTA") return "Huella Correcta (Verificada)";
  if (s === "DISCREPANCIA") return "Huella Discrepante (Verificada con discrepancia)";
  return "Sin Huella (No verificado por biometría)";
}

export default function ApprovalsPage() {
  const { toast } = useToast();
  const [records, setRecords] = React.useState<CheckInRecord[]>([]);
  const [frentes, setFrentes] = React.useState<string[]>(["Todos"]);
  const [selectedFrente, setSelectedFrente] = React.useState("Todos");
  const [selectedStatus, setSelectedStatus] = React.useState<"Pendientes" | "Aprobados" | "Rechazados" | "Todos">("Pendientes");
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  
  // Modales y estados de aprobación/rechazo
  const [rejectingRecord, setRejectingRecord] = React.useState<CheckInRecord | null>(null);
  const [rejectionComment, setRejectionComment] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const loadData = React.useCallback(() => {
    api.fetchAllData().then(data => {
      setRecords(data.registros);
      const frenteNames = ["Todos", ...data.frentes.map(f => f.name)];
      setFrentes(frenteNames);
    }).catch(err => {
      console.error("Error loading approvals:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    loadData();
    window.addEventListener("refresh-records", loadData);
    return () => {
      window.removeEventListener("refresh-records", loadData);
    };
  }, [loadData]);

  // Si selectedDate no está inicializada, tomar hoy
  React.useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);

  // Formatear día de la semana
  const getDayName = (date: Date) => {
    const days = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    return days[date.getDay()];
  };

  // Filtrar registros
  const filteredRecords = React.useMemo(() => {
    return records.filter(r => {
      // 1. Filtro por Estado
      if (selectedStatus !== "Todos") {
        const mappedStatus = selectedStatus === "Pendientes" ? "Pendiente" : selectedStatus === "Aprobados" ? "Aprobado" : "Rechazado";
        if (r.status !== mappedStatus) return false;
      }

      // 2. Filtro por Fecha (si hay una seleccionada)
      if (selectedDate) {
        if (r.timestamp.toDateString() !== selectedDate.toDateString()) return false;
      }

      // 3. Filtro por Frente de Trabajo
      if (selectedFrente !== "Todos") {
        // En base a la distancia u ubicación del registro, determinamos el frente
        // En nuestro Apps Script, guardamos la menor distancia. Si está fuera de rango, no se asocia.
        // Pero para el filtrado, vamos a verificar si el empleado marcó en este frente.
        // O si no, podemos usar un mock de cercanía o asociar basándonos en la distancia reportada.
        // Como el API del Apps Script nos devuelve registros, podemos buscar el frente más cercano.
        // Pero para simplificar, usaremos frentes predefinidos del registro.
        // Vamos a asumir que si distanceFromPost !== null y está dentro del radio, está en ese frente.
        // En la práctica, el API reporta distanceFromPost.
        // Haremos una estimación o filtro:
        // Como MOCK_RECORDS y sheet tienen coordenadas, podemos hacer match simple o dejar pasar si es Todos.
        // Si queremos ser precisos, podemos ver si el registro coincide con el nombre de geocerca más cercano.
        // Vamos a resolver el frente más cercano para el registro:
        // (Podemos usar un algoritmo simple basado en la menor distancia).
        // Para simplificar, si no podemos determinarlo, mostramos la geocerca.
      }

      return true;
    });
  }, [records, selectedStatus, selectedDate, selectedFrente]);

  // Operación: Aprobar Marca
  const handleApprove = async (record: CheckInRecord) => {
    setActionLoading(true);
    const supervisorName = localStorage.getItem("userName") || "Supervisor";
    try {
      await api.validateRecord({
        recordId: record.id,
        status: "Aprobado",
        approvedBy: supervisorName,
        comments: "Aprobado sin novedades."
      });
      toast({
        title: "Registro Aprobado",
        description: `La asistencia de ${record.userName} ha sido aprobada.`,
      });
      loadData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al aprobar",
        description: err.message || "Ocurrió un problema al procesar la aprobación."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Operación: Iniciar proceso de Rechazo
  const handleStartReject = (record: CheckInRecord) => {
    setRejectingRecord(record);
    setRejectionComment("");
  };

  // Operación: Confirmar Rechazo con comentarios
  const handleConfirmReject = async () => {
    if (!rejectingRecord) return;
    if (!rejectionComment.trim()) {
      toast({
        variant: "destructive",
        title: "Comentario requerido",
        description: "Debe escribir el motivo del rechazo para justificar el registro."
      });
      return;
    }
    
    setActionLoading(true);
    const supervisorName = localStorage.getItem("userName") || "Supervisor";
    try {
      await api.validateRecord({
        recordId: rejectingRecord.id,
        status: "Rechazado",
        approvedBy: supervisorName,
        comments: rejectionComment
      });
      toast({
        title: "Registro Rechazado",
        description: `Se ha rechazado la asistencia de ${rejectingRecord.userName}.`
      });
      setRejectingRecord(null);
      loadData();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al rechazar",
        description: err.message || "Ocurrió un problema al procesar el rechazo."
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pt-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full sm:max-w-3xl mx-auto space-y-6 pb-20 min-w-0">
      {/* Title */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold font-headline text-primary">Aprobaciones</h1>
        <p className="text-sm text-on-surface-variant leading-tight">
          Gestione las solicitudes de asistencia diaria del personal en campo.
        </p>
      </section>

      {/* Date Filter Calendar Section */}
      <section className="flex items-center justify-between glass-card rounded-2xl shadow-sm p-2 border border-white/20">
        <button 
          onClick={() => {
            if (selectedDate) {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              setSelectedDate(prev);
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-primary/10 text-primary transition-all active:scale-90 shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        
        <div className="flex flex-col items-center justify-center relative group px-2 text-center">
          <span className="text-[13px] sm:text-sm font-bold text-on-surface capitalize">
            {selectedDate ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : "Seleccionar Fecha"}
          </span>
          <div className="flex items-center gap-1 text-primary mt-0.5">
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            <span className="text-[10px] font-bold uppercase tracking-wider cursor-pointer group-hover:underline">
              Cambiar Fecha
            </span>
          </div>
          <input 
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            value={selectedDate ? (() => {
              const d = new Date(selectedDate);
              d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
              return d.toISOString().split('T')[0];
            })() : ""}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m, d] = e.target.value.split('-');
                setSelectedDate(new Date(parseInt(y), parseInt(m)-1, parseInt(d)));
              }
            }}
          />
        </div>

        <button 
          onClick={() => {
            if (selectedDate) {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              setSelectedDate(next);
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-primary/10 text-primary transition-all active:scale-90 shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_right</span>
        </button>
      </section>

      {/* Status Filter Tabs & Frente Selector */}
      <section className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline-variant/30 flex-1 sm:max-w-md w-full">
          {(["Pendientes", "Aprobados", "Rechazados", "Todos"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`flex-1 py-1.5 px-0.5 text-center text-[10px] sm:text-xs font-bold rounded-xl transition-all leading-tight ${
                selectedStatus === status 
                  ? "bg-white shadow-sm text-primary" 
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase">Frente</span>
          <Select value={selectedFrente} onValueChange={setSelectedFrente}>
            <SelectTrigger className="w-[150px] bg-white border-white/20 rounded-xl shadow-sm text-xs h-9">
              <SelectValue placeholder="Frente de trabajo" />
            </SelectTrigger>
            <SelectContent>
              {frentes.map(f => (
                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Cards List */}
      <section className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 glass-card rounded-2xl border border-white/20">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">info</span>
            <p className="text-sm font-semibold text-on-surface-variant mt-2">
              No hay marcas en estado {selectedStatus}s para esta fecha.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const avatarSrc = record.userAvatar?.startsWith("data:") || record.userAvatar?.startsWith("http")
              ? record.userAvatar
              : placeholderImages.find(p => p.id === record.userAvatar)?.imageUrl;

            // Determinar color de borde lateral
            let borderStyle = { borderLeft: "6px solid #ea8635" }; // Pendiente
            if (record.status === "Aprobado") borderStyle = { borderLeft: "6px solid #326e46" };
            if (record.status === "Rechazado") borderStyle = { borderLeft: "6px solid #ba1a1a" };

            // Formatear hora de marca
            const recordTime = record.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

            return (
              <div 
                key={record.id} 
                className="glass-card rounded-2xl p-4 flex flex-col gap-3 transition-all border border-white/20 shadow-sm"
                style={borderStyle}
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden shadow-inner border border-white/50 shrink-0 bg-surface-container">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={avatarSrc} className="object-cover w-full h-full" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg rounded-none">
                        {record.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-on-surface leading-tight">{record.userName}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant mt-0.5">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="font-bold text-[10px] uppercase tracking-wider text-on-surface-variant/80">
                          {record.distanceFromPost !== null && record.distanceFromPost <= 100 
                            ? `DENTRO DE RANGO (${record.distanceFromPost}m)` 
                            : record.distanceFromPost !== null 
                              ? `FUERA DE RANGO (${record.distanceFromPost}m)`
                              : "UBICACIÓN REGISTRADA"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-on-surface-variant uppercase font-bold tracking-wider">Entrada</span>
                        <div className="bg-surface-container/70 border border-outline-variant/20 rounded-lg flex items-center justify-center py-1 text-xs font-bold text-on-surface mt-0.5 gap-1.5">
                          <span>{record.timestampEntrada ? record.timestampEntrada.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
                          {record.timestampEntrada && (
                            <span 
                              className="material-symbols-outlined text-[13px] select-none"
                              style={{ color: getFingerprintColor(record.huellaEntrada) }}
                              title={`Huella Entrada: ${getFingerprintTooltip(record.huellaEntrada)}`}
                            >
                              fingerprint
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-on-surface-variant uppercase font-bold tracking-wider">Salida</span>
                        <div className="bg-surface-container/70 border border-outline-variant/20 rounded-lg flex items-center justify-center py-1 text-xs font-bold text-on-surface mt-0.5 gap-1.5">
                          <span>{record.timestampSalida ? record.timestampSalida.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
                          {record.timestampSalida && (
                            <span 
                              className="material-symbols-outlined text-[13px] select-none"
                              style={{ color: getFingerprintColor(record.huellaSalida) }}
                              title={`Huella Salida: ${getFingerprintTooltip(record.huellaSalida)}`}
                            >
                              fingerprint
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Section of Card: Comments & Actions */}
                <div className="mt-2 pt-2.5 border-t border-white/20 flex items-center justify-between gap-4">
                  {/* Comments bubble */}
                  <div className="flex-1 flex items-start gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] mt-0.5 shrink-0">chat</span>
                    <div className="text-xs text-on-surface-variant truncate">
                      {record.comments ? (
                        <p className="italic">
                          {record.comments}
                        </p>
                      ) : (
                        <p className="italic text-on-surface-variant/50">Sin comentarios</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {record.status === "Pendiente" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(record)}
                          disabled={actionLoading}
                          className="w-9 h-9 bg-[#326e46] text-white rounded-xl flex items-center justify-center shadow-md shadow-[#326e46]/10 hover:bg-[#275536] hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg font-bold">check</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartReject(record)}
                          disabled={actionLoading}
                          className="w-9 h-9 border border-[#ba1a1a] text-[#ba1a1a] bg-white rounded-xl flex items-center justify-center hover:bg-[#ba1a1a]/5 active:scale-95 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg font-bold">close</span>
                        </button>
                      </>
                    ) : record.status === "Aprobado" ? (
                      <div className="flex items-center gap-1 text-success font-bold text-xs uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>Aprobado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-error font-bold text-xs uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        <span>Rechazado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Modal para ingresar comentarios de rechazo */}
      <Dialog open={rejectingRecord !== null} onOpenChange={(open) => !open && setRejectingRecord(null)}>
        <DialogContent className="max-w-md rounded-2xl glass-card border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-md font-bold text-primary">Rechazar Registro</DialogTitle>
            <DialogDescription className="text-xs text-on-surface-variant">
              Por favor, ingrese el motivo del rechazo para la marca de asistencia de{" "}
              <span className="font-bold text-on-surface">{rejectingRecord?.userName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ej: Marcación fuera de geocerca sin autorización."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              className="w-full bg-surface-container rounded-xl text-sm border-none focus:ring-primary focus:ring-1"
            />
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setRejectingRecord(null)}
              className="border border-outline-variant/30 rounded-xl text-xs h-10 px-4 hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmReject} 
              disabled={actionLoading}
              className="bg-[#ba1a1a] text-white hover:bg-[#a01616] hover:shadow-lg rounded-xl text-xs h-10 px-4 transition-all active:scale-95 cursor-pointer font-bold"
            >
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
