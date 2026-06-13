'use client';

import * as React from "react";
import { api } from "@/lib/api";
import { type CheckInRecord } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ConsolidatedDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  record?: CheckInRecord;
  status?: "Aprobado" | "Pendiente" | "Rechazado";
}

export default function RecordsPage() {
  const { toast } = useToast();
  const [records, setRecords] = React.useState<CheckInRecord[]>([]);
  const [usersMap, setUsersMap] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  // Detalle del día seleccionado
  const [selectedDayDetail, setSelectedDayDetail] = React.useState<ConsolidatedDay | null>(null);
  
  // Edición de justificación
  const [isEditingComment, setIsEditingComment] = React.useState(false);
  const [justificationText, setJustificationText] = React.useState("");
  const [editCheckIn, setEditCheckIn] = React.useState("");
  const [editCheckOut, setEditCheckOut] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const loadRecords = React.useCallback(() => {
    setLoading(true);
    const loggedInUserId = localStorage.getItem('userId') || 'user-1'; 
    api.fetchAllData().then(data => {
      const userRecords = data.registros.filter(r => r.userId === loggedInUserId);
      setRecords(userRecords);

      // Build a map of email to user name
      const map: Record<string, string> = {};
      (data.usuarios || []).forEach(u => {
        if (u.email) {
          map[u.email.toLowerCase()] = u.name;
        }
      });
      setUsersMap(map);
    }).catch(err => {
      console.error("Error loading user records:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    loadRecords();
    window.addEventListener("refresh-records", loadRecords);
    return () => {
      window.removeEventListener("refresh-records", loadRecords);
    };
  }, [loadRecords]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Nombre del mes actual
  const monthName = React.useMemo(() => {
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${months[month]} ${year}`;
  }, [month, year]);

  // Cambiar mes
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDetail(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDetail(null);
  };

  // Calcular estadísticas Bento
  const stats = React.useMemo(() => {
    const dailyGroups: { [key: string]: { checkIn?: Date; checkOut?: Date; status?: string } } = {};
    
    records.forEach(r => {
      if (r.timestamp.getMonth() === month && r.timestamp.getFullYear() === year) {
        const dayStr = r.timestamp.getDate().toString();
        if (!dailyGroups[dayStr]) dailyGroups[dayStr] = {};
        if (r.timestampEntrada) dailyGroups[dayStr].checkIn = r.timestampEntrada;
        if (r.timestampSalida) dailyGroups[dayStr].checkOut = r.timestampSalida;
        
        if (!dailyGroups[dayStr].status) {
          dailyGroups[dayStr].status = r.status;
        } else if (r.status === "Rechazado" || dailyGroups[dayStr].status === "Rechazado") {
          dailyGroups[dayStr].status = "Rechazado";
        } else if (r.status === "Pendiente" || dailyGroups[dayStr].status === "Pendiente") {
          dailyGroups[dayStr].status = "Pendiente";
        }
      }
    });

    let totalMs = 0;
    let totalExtraMs = 0;
    const daysCount = Object.keys(dailyGroups).length;

    Object.values(dailyGroups).forEach(day => {
      if (day.checkIn && day.checkOut) {
        const diff = day.checkOut.getTime() - day.checkIn.getTime();
        const eightHours = 8 * 60 * 60 * 1000;
        totalMs += Math.min(diff, eightHours);
        if (diff > eightHours) {
          totalExtraMs += (diff - eightHours);
        }
      }
    });

    const formatHours = (ms: number) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
    };

    return {
      hoursLaboradas: formatHours(totalMs),
      daysLaborados: `${daysCount} día${daysCount !== 1 ? 's' : ''}`,
      hoursExtra: formatHours(totalExtraMs)
    };
  }, [records, month, year]);

  // Generar cuadrícula de días
  const calendarDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Lunes = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: ConsolidatedDay[] = [];

    // Relleno de mes anterior (grisáceo)
    for (let i = 0; i < firstDayOfWeek; i++) {
      const dayNum = prevMonthTotalDays - firstDayOfWeek + i + 1;
      days.push({
        date: new Date(year, month - 1, dayNum),
        day: dayNum,
        isCurrentMonth: false
      });
    }

    // Días del mes actual
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const dayRecords = records.filter(r => r.timestamp.toDateString() === dayDate.toDateString());
      
      const dayRecord = dayRecords[0]; // Como ahora es un solo registro por día
      
      days.push({
        date: dayDate,
        day: i,
        isCurrentMonth: true,
        record: dayRecord,
        status: dayRecord?.status
      });
    }

    // Relleno del mes siguiente para completar cuadrícula de 7 columnas
    const totalCells = Math.ceil(days.length / 7) * 7;
    const nextCellsCount = totalCells - days.length;
    for (let i = 1; i <= nextCellsCount; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        day: i,
        isCurrentMonth: false
      });
    }

    return days;
  }, [records, month, year]);

  // Selección de celda para ver detalle
  const handleSelectDay = (day: ConsolidatedDay) => {
    if (!day.isCurrentMonth || !day.record) return;
    setSelectedDayDetail(day);
    setJustificationText(day.record.comments || "");
    
    const formatTimeForInput = (date?: Date) => {
      if (!date) return "";
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    };
    setEditCheckIn(formatTimeForInput(day.record.timestampEntrada));
    setEditCheckOut(formatTimeForInput(day.record.timestampSalida));
    
    setIsEditingComment(false);
  };

  // Enviar modificación / justificación de rechazo
  const handleSendJustification = async () => {
    if (!selectedDayDetail) return;
    const recordId = selectedDayDetail.record?.id;
    if (!recordId) return;

    setActionLoading(true);
    try {
      await api.updateEmployeeComment(recordId, justificationText, editCheckIn || undefined, editCheckOut || undefined);
      toast({
        title: "Registro Actualizado",
        description: "Tu justificación y horarios han sido guardados. El registro vuelve a estar Pendiente de aprobación.",
      });
      setIsEditingComment(false);
      setSelectedDayDetail(null);
      loadRecords(); // Recargar base de datos
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: err.message || "No se pudo registrar la justificación."
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-md mx-auto pt-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full sm:max-w-md mx-auto space-y-6 pb-20 min-w-0">
      {/* Title */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold font-headline text-primary">Histórico de Turnos</h1>
        <p className="text-xs text-on-surface-variant leading-tight">
          Consulta tu actividad, horas registradas y estados de validación.
        </p>
      </section>

      {/* Month Selector */}
      <section className="glass-card rounded-2xl shadow-sm py-2 px-4 border border-white/20">
        <div className="flex items-center justify-between h-8">
          <button 
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 text-primary transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="text-sm font-bold text-on-surface">{monthName}</span>
          <button 
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary/10 text-primary transition-all active:scale-90"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Summary Bento Card */}
      <section className="glass-card rounded-2xl p-4 shadow-sm border border-white/20">
        <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Resumen del Periodo</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-on-surface-variant/80 uppercase">Horas Turno</span>
            <span className="text-xs font-bold text-on-surface mt-1">{stats.hoursLaboradas}</span>
          </div>
          <div className="flex flex-col items-center text-center border-x border-white/10">
            <span className="text-[9px] font-bold text-on-surface-variant/80 uppercase">Días</span>
            <span className="text-xs font-bold text-on-surface mt-1">{stats.daysLaborados}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-on-surface-variant/80 uppercase">Horas Extra</span>
            <span className="text-xs font-bold text-on-surface mt-1">{stats.hoursExtra}</span>
          </div>
        </div>
      </section>

      {/* Calendar Grid */}
      <section className="glass-card rounded-2xl p-3 shadow-sm border border-white/20">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-bold text-on-surface-variant/70">
          <div>LU</div>
          <div>MA</div>
          <div>MI</div>
          <div>JU</div>
          <div>VI</div>
          <div>SA</div>
          <div className="text-error">DO</div>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell, idx) => {
            const hasData = cell.isCurrentMonth && cell.record;
            const isClickable = hasData;

            // Determinar colores de estado
            let dotColor = "";
            if (cell.status === "Aprobado") dotColor = "bg-[#326e46]";
            else if (cell.status === "Pendiente") dotColor = "bg-[#ea8635]";
            else if (cell.status === "Rechazado") dotColor = "bg-[#ba1a1a]";

            // Formatear horas cortas
            const formatTime = (dateStr?: Date) => {
              if (!dateStr) return "--:--";
              return dateStr.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            };

            return (
              <button
                key={idx}
                type="button"
                disabled={!isClickable}
                onClick={() => handleSelectDay(cell)}
                className={`aspect-[1/1.25] flex flex-col items-center justify-between p-1 rounded-lg border transition-all ${
                  !cell.isCurrentMonth
                    ? "opacity-20 border-transparent bg-transparent"
                    : isClickable
                      ? "bg-white/50 border-white/40 shadow-sm cursor-pointer hover:border-primary/40 active:scale-95"
                      : "bg-surface-container/30 border-transparent opacity-50"
                }`}
              >
                <span className={`text-[10px] font-bold ${cell.isCurrentMonth ? "text-on-surface" : "text-on-surface-variant"}`}>
                  {cell.day}
                </span>

                {hasData ? (
                  <>
                    <div className="flex flex-col items-center text-[9px] leading-tight text-on-surface-variant font-medium">
                      <span>{cell.record?.timestampEntrada ? formatTime(cell.record.timestampEntrada) : ""}</span>
                      <span>{cell.record?.timestampSalida ? formatTime(cell.record.timestampSalida) : ""}</span>
                    </div>
                    {dotColor && <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
                  </>
                ) : (
                  <div className="h-6" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 justify-center items-center border-t border-white/10 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#326e46]"></div>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Aprobado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ea8635]"></div>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Pendiente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ba1a1a]"></div>
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Rechazado</span>
          </div>
        </div>
      </section>

      {/* Drawer/Modal para Detalles y Solicitud de Modificación */}
      <Dialog open={selectedDayDetail !== null} onOpenChange={(open) => !open && setSelectedDayDetail(null)}>
        <DialogContent className="max-w-md rounded-2xl glass-card border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-md font-bold text-primary">Detalle de Asistencia</DialogTitle>
            <DialogDescription className="text-xs text-on-surface-variant">
              Registro del día {selectedDayDetail?.date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </DialogDescription>
          </DialogHeader>

          {selectedDayDetail && (
            <div className="space-y-4 py-2">
              {/* Horarios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container/60 p-3 rounded-xl border border-white/10">
                  <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase">Entrada</span>
                  {isEditingComment ? (
                    <input 
                      type="time" 
                      className="w-full bg-surface-container rounded-lg p-1 text-sm font-bold text-on-surface mt-1 border border-white/20 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-bold text-on-surface mt-0.5">
                      {selectedDayDetail.record?.timestampEntrada 
                        ? selectedDayDetail.record.timestampEntrada.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) 
                        : "--:--"}
                    </p>
                  )}
                  {selectedDayDetail.record?.distanceFromPost !== null && (
                    <p className="text-[9px] text-on-surface-variant mt-0.5">
                      Distancia: {selectedDayDetail.record?.distanceFromPost}m
                    </p>
                  )}
                </div>
                <div className="bg-surface-container/60 p-3 rounded-xl border border-white/10">
                  <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase">Salida</span>
                  {isEditingComment ? (
                    <input 
                      type="time" 
                      className="w-full bg-surface-container rounded-lg p-1 text-sm font-bold text-on-surface mt-1 border border-white/20 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-bold text-on-surface mt-0.5">
                      {selectedDayDetail.record?.timestampSalida 
                        ? selectedDayDetail.record.timestampSalida.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) 
                        : "--:--"}
                    </p>
                  )}
                </div>
              </div>

              {/* Estado y Aprobador */}
              <div className="flex flex-col gap-2 bg-surface-container/30 px-3 py-2 rounded-xl border border-white/10 text-xs">
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-on-surface-variant uppercase text-[10px]">Estado del Registro</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                    selectedDayDetail.status === "Aprobado" 
                      ? "bg-success/15 text-success" 
                      : selectedDayDetail.status === "Rechazado" 
                        ? "bg-error/15 text-error" 
                        : "bg-warning/15 text-warning"
                  }`}>
                    {selectedDayDetail.status}
                  </span>
                </div>
                {selectedDayDetail.status === "Aprobado" && selectedDayDetail.record?.approvedBy && (
                  <div className="flex justify-between items-center w-full pt-1.5 border-t border-white/10">
                    <span className="font-bold text-on-surface-variant uppercase text-[10px]">Aprobado por</span>
                    <span className="font-medium text-on-surface text-[11px]">
                      {selectedDayDetail.record.approvedBy.includes("@") 
                        ? (usersMap[selectedDayDetail.record.approvedBy.toLowerCase()] || selectedDayDetail.record.approvedBy)
                        : selectedDayDetail.record.approvedBy}
                    </span>
                  </div>
                )}
                {selectedDayDetail.status === "Rechazado" && selectedDayDetail.record?.approvedBy && (
                  <div className="flex justify-between items-center w-full pt-1.5 border-t border-white/10">
                    <span className="font-bold text-on-surface-variant uppercase text-[10px]">Rechazado por</span>
                    <span className="font-medium text-on-surface text-[11px]">
                      {selectedDayDetail.record.approvedBy.includes("@") 
                        ? (usersMap[selectedDayDetail.record.approvedBy.toLowerCase()] || selectedDayDetail.record.approvedBy)
                        : selectedDayDetail.record.approvedBy}
                    </span>
                  </div>
                )}
              </div>

              {/* Justificación / Comentarios */}
              <div className="space-y-1">
                <span className="font-bold text-on-surface-variant uppercase text-[10px]">Justificación / Comentarios</span>
                {isEditingComment ? (
                  <Textarea
                    className="w-full bg-surface-container rounded-xl text-xs mt-1 min-h-[70px] border-none focus:ring-primary focus:ring-1"
                    value={justificationText}
                    onChange={(e) => setJustificationText(e.target.value)}
                    placeholder="Escribe tu justificación aquí para re-someter el registro..."
                  />
                ) : (
                  <div className="bg-surface-container/60 p-3 rounded-xl border border-white/10 min-h-[40px] text-xs">
                    <p className="text-on-surface italic">
                      {selectedDayDetail.record?.comments || "Sin comentarios."}
                    </p>
                  </div>
                )}
              </div>

              {/* Firmas registradas (visualización) */}
              {(selectedDayDetail.entrada?.signatureUrl || selectedDayDetail.salida?.signatureUrl) && (
                <div className="space-y-1">
                  <span className="font-bold text-on-surface-variant uppercase text-[10px]">Firma Digital</span>
                  <div className="h-24 w-full bg-white border border-outline-variant/30 rounded-xl overflow-hidden flex items-center justify-center p-2 relative shadow-inner">
                    <img 
                      src={selectedDayDetail.entrada?.signatureUrl || selectedDayDetail.salida?.signatureUrl} 
                      alt="Firma"
                      className="h-full object-contain filter contrast-125 select-none pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end pt-2 border-t border-white/10">
            {selectedDayDetail?.status === "Rechazado" ? (
              <>
                {isEditingComment ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingComment(false)}
                      className="rounded-xl text-xs h-10 px-4"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSendJustification} 
                      disabled={actionLoading}
                      className="bg-primary text-white hover:opacity-90 rounded-xl text-xs h-10 px-4"
                    >
                      Guardar Cambios
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDayDetail(null)}
                      className="rounded-xl text-xs h-10 px-4"
                    >
                      Cerrar
                    </Button>
                    <Button 
                      onClick={() => setIsEditingComment(true)}
                      className="bg-warning text-white hover:opacity-90 rounded-xl text-xs h-10 px-4"
                    >
                      Editar Registro
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button 
                onClick={() => setSelectedDayDetail(null)}
                className="bg-primary text-white hover:opacity-90 rounded-xl text-xs h-10 px-4"
              >
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
