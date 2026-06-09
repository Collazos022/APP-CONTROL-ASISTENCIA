"use client";

import * as React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2, X } from "lucide-react";
import { type CheckInType, type CheckInRecord } from "@/lib/types";
import { api } from "@/lib/api";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [location, setLocation] = React.useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentAction, setCurrentAction] = React.useState<CheckInType | null>(null);
  
  const [frentes, setFrentes] = React.useState<{ name: string; coords: string; radio: number }[]>([]);
  const [todayRecords, setTodayRecords] = React.useState<CheckInRecord[]>([]);
  const [userId, setUserId] = React.useState<string>("");
  const [userName, setUserName] = React.useState<string>("");
  const [userAvatar, setUserAvatar] = React.useState<string>("avatar-1");
  const [checkoutComment, setCheckoutComment] = React.useState<string>("");

  const loadDashboardData = React.useCallback(() => {
    const loggedInUserId = localStorage.getItem("userId") || "user-1";
    setUserId(loggedInUserId);
    setUserName(localStorage.getItem("userName") || "");
    setUserAvatar(localStorage.getItem("userAvatar") || "avatar-1");

    api.fetchAllData().then(data => {
      setFrentes(data.frentes);
      // Filtrar registros de hoy para este usuario
      const today = new Date().toDateString();
      const userTodayRecs = data.registros.filter(
        r => r.userId === loggedInUserId && r.timestamp.toDateString() === today
      );
      setTodayRecords(userTodayRecs);
    }).catch(err => {
      console.error("Error cargando datos del dashboard:", err);
    });
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadDashboardData();
    return () => clearInterval(timer);
  }, [loadDashboardData]);

  // Capturar geolocalización al hacer clic en los botones de Entrada/Salida
  const handleActionClick = (action: CheckInType) => {
    setCurrentAction(action);
    setCheckoutComment(""); // Restablecer comentario
    setIsSubmitting(false);
    setLocation(null);
    setLocationError(null);
    
    // Abrir el modal inmediatamente para mostrar feedback visual de carga de GPS
    setDialogOpen(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("GPS Error:", error);
          setLocationError(`Error de GPS: ${error.message}. Asegúrese de tener el GPS activado.`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError("Geolocalización no es soportada por este navegador.");
    }
  };

  const handleSignatureSubmit = async (signature: string) => {
    if (!location) {
        toast({
            variant: "destructive",
            title: "Ubicación Requerida",
            description: "No se puede marcar asistencia sin coordenadas GPS válidas. Por favor espere a que se obtenga la señal.",
        });
        return;
    }

    setIsSubmitting(true);
    
    try {
      await api.checkInOut({
        userId,
        userName,
        typeAction: currentAction!,
        latitude: location.lat,
        longitude: location.lon,
        signatureBase64: signature,
        userAvatar,
        employeeComments: currentAction === "Salida" ? checkoutComment : undefined
      });
      
      setDialogOpen(false);
      toast({
        title: "Registro Exitoso",
        description: `Se ha registrado su ${currentAction?.toLowerCase()} a las ${new Date().toLocaleTimeString()}.`,
      });
      loadDashboardData(); // Recargar datos para actualizar las horas trabajadas
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al registrar asistencia",
        description: err.message || "No se pudo conectar con el servidor. Intente de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular la distancia al frente más cercano
  const getNearestFront = () => {
    if (!location || frentes.length === 0) return null;
    let minDistance = null;
    let nearest = null;
    
    frentes.forEach(frente => {
      const parts = frente.coords.split(",");
      const fLat = parseFloat(parts[0]);
      const fLon = parseFloat(parts[1]);
      if (!isNaN(fLat) && !isNaN(fLon)) {
        const R = 6371000;
        const dLat = (fLat - location.lat) * Math.PI / 180;
        const dLon = (fLon - location.lon) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(location.lat * Math.PI / 180) * Math.cos(fLat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const dist = R * c;
        if (minDistance === null || dist < minDistance) {
          minDistance = Math.round(dist);
          nearest = { name: frente.name, distance: minDistance, inside: dist <= frente.radio };
        }
      }
    });
    return nearest as { name: string; distance: number; inside: boolean } | null;
  };

  const nearest = getNearestFront();

  // Calcular horas trabajadas en el turno de hoy (del primer Check-In de Entrada al Check-Out o a la hora actual)
  const calculateShiftHours = () => {
    const entradaRecs = todayRecords.filter(r => r.type === "Entrada" && r.status !== "Rechazado");
    if (entradaRecs.length === 0) return { hours: 0, minutes: 0, formatted: "00h 00m", percent: 0 };

    // Ordenar de más antiguo a más reciente
    const firstEntrada = entradaRecs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
    
    const salidaRecs = todayRecords.filter(r => r.type === "Salida" && r.status !== "Rechazado");
    const lastSalida = salidaRecs.length > 0 
      ? salidaRecs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
      : null;

    const end = lastSalida ? lastSalida.timestamp : new Date();
    const diffMs = end.getTime() - firstEntrada.timestamp.getTime();
    
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    const formatted = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
    
    // Porcentaje basado en un turno de 8 horas (480 minutos)
    const percent = Math.min(100, Math.round((diffMins / 480) * 100));

    return { hours, minutes, formatted, percent };
  };

  const shift = calculateShiftHours();

  // Formatear hora y fecha en español
  const formattedTime = currentTime.toLocaleTimeString("es-MX", { hour12: false });
  const rawDateStr = currentTime.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedDate = rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6 pt-4">
      {/* Reloj y Fecha digital */}
      <section className="text-center py-2">
        <h1 className="text-5xl font-bold font-headline text-primary tracking-tight leading-none">
          {formattedTime}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2">
          {formattedDate}
        </p>
      </section>

      {/* Tarjeta de Estado GPS */}
      <section className="glass-card rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            location_on
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado de GPS</span>
          {location ? (
            nearest ? (
              <>
                <p className={`text-sm font-bold ${nearest.inside ? "text-green-600" : "text-amber-600"}`}>
                  {nearest.inside ? `✓ Dentro de geocerca en ${nearest.name}` : `⚠️ Fuera de geocerca (${nearest.name} a ${nearest.distance}m)`}
                </p>
                <p className="text-xs text-slate-400">Distancia calculada: {nearest.distance}m</p>
              </>
            ) : (
              <p className="text-sm font-bold text-slate-600">
                Ubicación registrada ({location.lat.toFixed(4)}, {location.lon.toFixed(4)})
              </p>
            )
          ) : locationError ? (
            <p className="text-sm font-bold text-destructive">{locationError}</p>
          ) : (
            <p className="text-sm font-bold text-slate-500 animate-pulse">Buscando señal satelital...</p>
          )}
        </div>
      </section>

      {/* Horas en turno y Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        
        {/* Bento: Horas trabajadas */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-32 flex-1 gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Horas en Turno</span>
          <p className="text-3xl font-bold font-headline text-primary">{shift.formatted}</p>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-green-600 h-full rounded-full transition-all duration-500" style={{ width: `${shift.percent}%` }} />
          </div>
        </div>

        {/* Botones de marcas verticales */}
        <div className="flex flex-col gap-3 flex-1 justify-center">
          <button
            onClick={() => handleActionClick("Entrada")}
            className="active-tap w-full bg-green-600 hover:bg-green-700 rounded-xl flex items-center justify-center gap-2 h-14 shadow-md text-white font-bold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-white text-[20px]">login</span>
            <span>Marcar Entrada</span>
          </button>
          <button
            onClick={() => handleActionClick("Salida")}
            className="active-tap w-full bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center justify-center gap-2 h-14 shadow-md text-white font-bold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-white text-[20px]">logout</span>
            <span>Marcar Salida</span>
          </button>
        </div>

      </div>

      {/* Modal de Firma y Comentarios */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-t-3xl sm:rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold font-headline text-slate-800">
                Confirmar {currentAction}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                Firme y complete la información para registrar la marca.
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => setDialogOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Feedback del GPS */}
            <div className="space-y-1">
              <div className="flex items-center text-xs font-semibold text-slate-500">
                <MapPin className={cn("h-4 w-4 mr-2", location ? "text-green-500" : "text-amber-500 animate-pulse")} />
                <span>
                  {location ? "Ubicación satelital establecida." : "Buscando coordenadas GPS..."}
                </span>
              </div>
              {location && nearest && (
                <div className={`text-xs font-bold pl-6 ${nearest.inside ? "text-green-600" : "text-amber-600"}`}>
                  {nearest.inside ? (
                    <span>✓ En geocerca: {nearest.name}</span>
                  ) : (
                    <span>⚠️ Fuera de geocerca de {nearest.name} ({nearest.distance}m)</span>
                  )}
                </div>
              )}
            </div>

            {/* Comentario exclusivo para la Salida */}
            {currentAction === "Salida" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Observaciones / Comentario de Salida</label>
                <textarea
                  value={checkoutComment}
                  onChange={(e) => setCheckoutComment(e.target.value)}
                  placeholder="Escriba comentarios sobre las actividades de su turno (obligatorio si requiere justificación)..."
                  className="w-full min-h-[70px] p-3 border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                />
              </div>
            )}

            {/* Firma digital */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block mb-1">Firma Digital</label>
              <SignaturePad 
                onSave={handleSignatureSubmit} 
                disabled={isSubmitting || !location} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
