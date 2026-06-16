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
import { MapPin, Loader2, X, Fingerprint } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { type CheckInType, type CheckInRecord } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);
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

  const [userHuella, setUserHuella] = React.useState<string>("" );
  const [huellaStatus, setHuellaStatus] = React.useState<"CORRECTA" | "DISCREPANCIA" | "SIN_HUELLA">("SIN_HUELLA");
  
  // Nuevos estados para diálogo único y sincronización
  const [signatureBase64, setSignatureBase64] = React.useState<string>("");
  const [showSignaturePad, setShowSignaturePad] = React.useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);
  const locationRef = React.useRef<{ lat: number; lon: number } | null>(null);
  const isSignatureAcceptedRef = React.useRef(false);

  React.useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Estados para validación biométrica nativa embebida
  const [biometricState, setBiometricState] = React.useState<"idle" | "scanning" | "success" | "warning" | "error">("idle");
  const [biometricMessage, setBiometricMessage] = React.useState("");
  const [biometricWarningText, setBiometricWarningText] = React.useState<string | null>(null);

  // Helper para decodificación de huella
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const loadDashboardData = React.useCallback(() => {
    setLoading(true);
    const loggedInUserId = localStorage.getItem("userId") || "user-1";
    setUserId(loggedInUserId);
    setUserName(localStorage.getItem("userName") || "");
    setUserAvatar(localStorage.getItem("userAvatar") || "avatar-1");

    return api.fetchAllData().then(data => {
      setFrentes(data.frentes);
      const userObj = data.usuarios.find(u => u.id === loggedInUserId);
      if (userObj) {
        setUserHuella(userObj.huella || "");
      }
      // Filtrar registros de hoy para este usuario
      const today = new Date().toDateString();
      const userTodayRecs = data.registros.filter(
        r => r.userId === loggedInUserId && r.timestamp.toDateString() === today
      );
      setTodayRecords(userTodayRecs);
    }).catch(err => {
      console.error("Error cargando datos del dashboard:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadDashboardData();
    return () => clearInterval(timer);
  }, [loadDashboardData]);

  // Solicitar ubicación GPS tan pronto como carga el componente
  React.useEffect(() => {
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
          console.error("GPS Init Error:", error);
          setLocationError(`Error de GPS: ${error.message}. Active su ubicación.`);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError("Geolocalización no soportada.");
    }
  }, []);

  // Detectar soporte para biometría al montar el componente
  React.useEffect(() => {
    const supported = typeof window !== "undefined" && 
                      !!navigator.credentials && 
                      !!navigator.credentials.create &&
                      window.isSecureContext;
    setIsBiometricSupported(supported);
  }, []);

  // Escaneo biométrico nativo en Entrada/Salida
  const triggerBiometricVerification = async (): Promise<boolean> => {
    if (!userHuella) return false;
    setBiometricState("scanning");
    setBiometricMessage("Active el sensor de huella de su dispositivo...");
    setBiometricWarningText(null);

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      let credentialId: Uint8Array;
      try {
        credentialId = base64ToUint8Array(userHuella);
      } catch (e) {
        throw new Error("Formato WebAuthn no válido.");
      }
      
      const options: CredentialRequestOptions = {
        publicKey: {
          challenge: challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            id: credentialId,
            type: "public-key"
          }],
          userVerification: "required",
          timeout: 60000
        }
      };
      
      const assertion = await navigator.credentials.get(options) as PublicKeyCredential;
      if (!assertion) throw new Error("Verificación fallida");
      
      setBiometricState("success");
      setBiometricMessage("¡Huella digital verificada ✓!");
      setHuellaStatus("CORRECTA");
      return true;
    } catch (err: any) {
      console.error("WebAuthn Verify Error:", err);
      
      if (err.name === "NotAllowedError") {
        setBiometricState("error");
        setBiometricMessage("Verificación cancelada por el usuario.");
        setHuellaStatus("SIN_HUELLA");
      } else {
        setBiometricState("warning");
        setBiometricMessage("Error de concordancia");
        setBiometricWarningText(
          `⚠️ La verificación falló (${err.message}). Puede reintentar o marcar usando su firma.`
        );
        setHuellaStatus("DISCREPANCIA");
      }
      return false;
    }
  };

  const handleProceedWithDiscrepancy = () => {
    setHuellaStatus("DISCREPANCIA");
    setBiometricState("warning");
    setBiometricMessage("Huella discrepante aceptada.");
    setBiometricWarningText(null);
  };

  // Capturar geolocalización al hacer clic en los botones de Entrada/Salida
  const handleActionClick = async (action: CheckInType) => {
    setCurrentAction(action);
    setCheckoutComment(""); // Restablecer comentario
    setIsSubmitting(false);
    setBiometricWarningText(null);
    setSignatureBase64("");
    setBiometricState("idle");
    setBiometricMessage("");

    // Obtener GPS en segundo plano sin bloquear el hilo principal (manteniendo valor previo si existe)
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
          if (!locationRef.current) {
            setLocationError(`Error de GPS: ${error.message}. Asegúrese de tener el GPS activado.`);
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else if (!locationRef.current) {
      setLocationError("Geolocalización no es soportada por este navegador.");
    }
    
    const hasFingerprint = !!userHuella && isBiometricSupported;
    if (hasFingerprint) {
      // Iniciar el lector de huella inmediatamente antes de mostrar cualquier modal
      const success = await triggerBiometricVerification();
      if (success) {
        if (action === "Entrada") {
          // Si es Entrada, auto-registrar de inmediato sin abrir el modal unificado
          // Esperamos hasta 3 segundos si la geolocalización aún no está lista
          let currentLoc = locationRef.current;
          if (!currentLoc) {
            setIsSyncing(true);
            for (let i = 0; i < 15; i++) {
              await new Promise((resolve) => setTimeout(resolve, 200));
              if (locationRef.current) {
                currentLoc = locationRef.current;
                break;
              }
            }
            setIsSyncing(false);
          }

          if (currentLoc) {
            setIsSubmitting(true);
            setIsSyncing(true);
            try {
              await api.checkInOut({
                userId: localStorage.getItem("userId") || "user-1",
                userName: localStorage.getItem("userName") || "",
                typeAction: "Entrada",
                latitude: currentLoc.lat,
                longitude: currentLoc.lon,
                signatureBase64: "",
                userAvatar: localStorage.getItem("userAvatar") || "avatar-1",
                huellaStatus: "CORRECTA"
              });
              await loadDashboardData();
              toast({
                title: "Registro Exitoso",
                description: "Se ha registrado su entrada correctamente mediante huella digital.",
              });
            } catch (err: any) {
              toast({
                variant: "destructive",
                title: "Error al registrar asistencia",
                description: err.message || "No se pudo conectar con el servidor.",
              });
              // Si falla el registro, abrir el diálogo para reintentar o firmar
              setShowSignaturePad(false);
              setDialogOpen(true);
            } finally {
              setIsSubmitting(false);
              setIsSyncing(false);
            }
          } else {
            // Si el GPS falla, abrir el modal unificado para que vea el error
            setShowSignaturePad(false);
            setDialogOpen(true);
          }
        } else {
          // Si es Salida, sí necesitamos comentarios, abrimos el modal
          setHuellaStatus("CORRECTA");
          setShowSignaturePad(false);
          setDialogOpen(true);
        }
      } else {
        // Si falló o canceló la verificación biométrica, abrimos el modal con firma obligatoria
        setHuellaStatus("SIN_HUELLA");
        setShowSignaturePad(true);
        setDialogOpen(true);
      }
    } else {
      // Sin huella registrada/soportada: ir directo al modal con firma obligatoria
      setHuellaStatus("SIN_HUELLA");
      setShowSignaturePad(true);
      setDialogOpen(true);
    }
  };

  const handleMarkSubmit = async () => {
    if (!location) {
      toast({
        variant: "destructive",
        title: "Ubicación Requerida",
        description: "No se puede marcar asistencia sin coordenadas GPS válidas. Por favor espere a que se obtenga la señal.",
      });
      return;
    }

    // Si no se validó por huella (sin huella registrada o no soportado o cancelado), la firma es obligatoria
    const isSignatureRequired = !userHuella || !isBiometricSupported || huellaStatus === "SIN_HUELLA";
    if (isSignatureRequired && !signatureBase64) {
      toast({
        variant: "destructive",
        title: "Firma Requerida",
        description: "Dado que no se validó con huella digital, debe ingresar su firma para continuar.",
      });
      return;
    }

    setIsSubmitting(true);
    setIsSyncing(true); // Activar máscara bloqueante

    try {
      await api.checkInOut({
        userId,
        userName,
        typeAction: currentAction!,
        latitude: location.lat,
        longitude: location.lon,
        signatureBase64: signatureBase64,
        userAvatar,
        employeeComments: currentAction === "Salida" ? checkoutComment : undefined,
        huellaStatus: huellaStatus
      });

      // Recargar datos y esperar a que termine para actualizar el Turno
      await loadDashboardData();

      setDialogOpen(false);
      toast({
        title: "Registro Exitoso",
        description: `Se ha registrado su ${currentAction?.toLowerCase()} correctamente.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al registrar asistencia",
        description: err.message || "No se pudo conectar con el servidor. Intente de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
      setIsSyncing(false); // Apagar máscara
    }
  };

  // Calcular la distancia al frente más cercano
  const getNearestFront = () => {
    if (!location || frentes.length === 0) return null;
    let minDistance: number | null = null;
    let nearest: { name: string; distance: number; inside: boolean } | null = null;
    
    frentes.forEach(frente => {
      if (!frente.coords || typeof frente.coords !== 'string') return;
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
    const validRecs = todayRecords.filter(r => r.status !== "Rechazado");
    if (validRecs.length === 0) return { hours: 0, minutes: 0, formatted: "00h 00m", percent: 0 };

    // Ordenar de más antiguo a más reciente para tomar la primera entrada
    const sortedRecs = validRecs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const todayRec = sortedRecs[0];

    if (!todayRec.timestampEntrada) return { hours: 0, minutes: 0, formatted: "00h 00m", percent: 0 };

    const end = todayRec.timestampSalida ? todayRec.timestampSalida : new Date();

    // Descontar la hora de almuerzo (12:00 a 13:00) del mismo día si se solapa con el turno
    const lunchStart = new Date(todayRec.timestampEntrada);
    lunchStart.setHours(12, 0, 0, 0);
    const lunchEnd = new Date(todayRec.timestampEntrada);
    lunchEnd.setHours(13, 0, 0, 0);

    const overlapStart = Math.max(todayRec.timestampEntrada.getTime(), lunchStart.getTime());
    const overlapEnd = Math.min(end.getTime(), lunchEnd.getTime());
    const overlapMs = overlapEnd > overlapStart ? overlapEnd - overlapStart : 0;

    const diffMs = end.getTime() - todayRec.timestampEntrada.getTime() - overlapMs;
    
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    const formatted = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
    
    // Porcentaje basado en un turno de 8 horas (480 minutos)
    const percent = Math.min(100, Math.round((diffMins / 480) * 100));

    return { hours, minutes, formatted, percent };
  };

  const shift = calculateShiftHours();
  
  // Buscar un turno abierto (tiene entrada pero no tiene salida)
  const openShift = todayRecords.find(r => r.timestampEntrada && !r.timestampSalida && r.status !== "Rechazado");
  const canCheckIn = !openShift; // Solo puede marcar entrada si no hay un turno abierto
  const canCheckOut = !!openShift; // Solo puede marcar salida si hay un turno abierto

  // Formatear hora y fecha en español, evitando errores de hidratación (mismatch servidor/cliente)
  const formattedTime = mounted ? currentTime.toLocaleTimeString("es-MX", { hour12: false }) : "--:--:--";
  const rawDateStr = mounted ? currentTime.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "";
  const formattedDate = rawDateStr ? rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1) : "Cargando...";

  if (loading) {
    return (
      <div className="max-w-lg mx-auto flex flex-col gap-6 pt-4">
        {/* Reloj y Fecha digital */}
        <section className="text-center py-2 space-y-2">
          <Skeleton className="h-12 w-48 mx-auto rounded-xl bg-slate-100/80" />
          <Skeleton className="h-4 w-36 mx-auto rounded-lg bg-slate-100/80" />
        </section>

        {/* Tarjeta de Estado GPS */}
        <section className="glass-card rounded-2xl p-5 flex items-start gap-4 shadow-sm border border-slate-100/50 bg-white/50">
          <Skeleton className="w-12 h-12 rounded-xl shrink-0 bg-slate-100/80" />
          <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-3 w-24 bg-slate-100/80 rounded" />
            <Skeleton className="h-4.5 w-48 bg-slate-100/80 rounded" />
          </div>
        </section>

        {/* Horas en turno y Acciones */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          
          {/* Bento: Horas trabajadas */}
          <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-32 flex-1 gap-2 border border-slate-100/50 bg-white/50">
            <Skeleton className="h-3 w-28 bg-slate-100/80 rounded" />
            <Skeleton className="h-8 w-36 bg-slate-100/80 rounded" />
            <Skeleton className="h-2 w-full rounded-full bg-slate-100/80" />
          </div>

          {/* Botones de marcas verticales */}
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <Skeleton className="h-14 w-full rounded-xl bg-slate-100/80" />
            <Skeleton className="h-14 w-full rounded-xl bg-slate-100/80" />
          </div>

        </div>
      </div>
    );
  }

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
          <span className="material-symbols-outlined text-[24px] fill-icon">
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
            disabled={!canCheckIn}
            className={`active-tap w-full rounded-xl flex items-center justify-center gap-2 h-14 shadow-md font-bold text-sm transition-all ${
              canCheckIn
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${!canCheckIn ? "text-slate-500" : "text-white"}`}>
              {canCheckIn ? "login" : "check_circle"}
            </span>
            <span className={!canCheckIn ? "text-slate-500" : "text-white"}>
              {canCheckIn 
                ? "Marcar Entrada" 
                : openShift?.timestampEntrada 
                  ? `Entrada: ${openShift.timestampEntrada.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}` 
                  : "Entrada Registrada"}
            </span>
          </button>
          <button
            onClick={() => handleActionClick("Salida")}
            disabled={!canCheckOut}
            className={`active-tap w-full rounded-xl flex items-center justify-center gap-2 h-14 shadow-md font-bold text-sm transition-all ${
              canCheckOut 
                ? "bg-amber-500 hover:bg-amber-600 text-white" 
                : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Marcar Salida</span>
          </button>
        </div>

      </div>

      {/* Modal de Marcación Unificado */}
      <Dialog open={dialogOpen} onOpenChange={(val) => { if (!val && !isSubmitting) setDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-6 bg-white max-h-[95vh] overflow-y-auto border border-slate-100 shadow-2xl">
          <DialogHeader className="flex flex-row items-start justify-between">
            <div className="text-left">
              <DialogTitle className="text-xl font-bold font-headline text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  {currentAction === "Entrada" ? "login" : "logout"}
                </span>
                Confirmar {currentAction}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                Complete la verificación para registrar su marca de asistencia.
              </p>
            </div>
          </DialogHeader>
          
          <div className="py-4 space-y-5 text-left">
            {/* Feedback del GPS */}
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100/50 space-y-1">
              <div className="flex items-center text-xs font-semibold text-slate-600">
                <MapPin className={cn("h-4 w-4 mr-2", location ? "text-green-500" : "text-amber-500 animate-pulse")} />
                <span>
                  {location ? "Ubicación satelital establecida" : "Buscando coordenadas GPS..."}
                </span>
              </div>
              {location && nearest && (
                <div className={`text-[11px] font-bold pl-6 ${nearest.inside ? "text-green-600" : "text-amber-600"}`}>
                  {nearest.inside ? (
                    <span>✓ En geocerca: {nearest.name}</span>
                  ) : (
                    <span>⚠️ Fuera de geocerca de {nearest.name} ({nearest.distance}m)</span>
                  )}
                </div>
              )}
            </div>

            {/* SECCIÓN DE HUELLA DIGITAL (Solo si está registrada y soportada) */}
            {userHuella && isBiometricSupported && (
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-4 w-full">

                <div className="flex items-center gap-4 w-full">
                  {/* Icono de Huella Animado */}
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 relative",
                    biometricState === "idle" && "bg-slate-100 text-slate-400 border-slate-200",
                    biometricState === "scanning" && "bg-primary/10 text-primary border-primary/20 scale-105",
                    biometricState === "success" && "bg-green-50 text-green-600 border-green-200",
                    biometricState === "warning" && "bg-amber-50 text-amber-600 border-amber-200",
                    biometricState === "error" && "bg-red-50 text-red-600 border-red-200"
                  )}>
                    <Fingerprint className={cn("w-7 h-7", biometricState === "scanning" && "animate-pulse")} />
                    {biometricState === "scanning" && (
                      <div className="absolute left-0 right-0 h-0.5 bg-primary/80 shadow-md top-1 animate-bounce" />
                    )}
                  </div>

                  {/* Mensajes de Estado */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-bold transition-all duration-300 truncate",
                      biometricState === "idle" && "text-slate-500",
                      biometricState === "scanning" && "text-primary animate-pulse",
                      biometricState === "success" && "text-green-600",
                      biometricState === "warning" && "text-amber-600",
                      biometricState === "error" && "text-red-500"
                    )}>
                      {biometricMessage}
                    </p>
                    {biometricState === "success" ? (
                      <span className="text-xs text-slate-500 block mt-1">Firma opcional habilitada</span>
                    ) : (
                      <span className="text-xs text-slate-500 block mt-1">Se requiere firma si no valida con Huella</span>
                    )}
                  </div>
                </div>

                {/* Advertencia de Discrepancia */}
                {biometricWarningText && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-left w-full space-y-2">
                    <p className="text-[10px] text-amber-800 leading-normal font-medium">
                      {biometricWarningText}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleProceedWithDiscrepancy}
                        className="flex-1 py-1.5 h-auto text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                      >
                        Proceder con Discrepancia
                      </Button>
                      <Button
                        type="button"
                        onClick={triggerBiometricVerification}
                        variant="outline"
                        className="flex-1 py-1.5 h-auto text-[10px] border-amber-300 text-amber-700 hover:bg-amber-100/50 font-bold rounded-lg"
                      >
                        Reintentar Lector
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botón de reintento manual */}
                {biometricState === "error" && (
                  <Button
                    type="button"
                    onClick={triggerBiometricVerification}
                    variant="outline"
                    className="w-full text-[11px] py-1.5 h-auto border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 font-bold rounded-xl"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    Reintentar Sensor de Huellas
                  </Button>
                )}

                {/* Botón/Estado de firma movido aquí dentro, debajo de "Reintentar Sensor Fisico" */}
                {showSignaturePad && (
                  <div className="w-full pt-1">
                    {signatureBase64 ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl p-3 w-full">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                          <span className="text-xs font-bold text-green-700">Firma registrada ✓</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            isSignatureAcceptedRef.current = false;
                            setSignatureDialogOpen(true);
                          }}
                          className="text-xs text-primary hover:underline font-bold"
                        >
                          Modificar
                        </button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          isSignatureAcceptedRef.current = false;
                          setSignatureDialogOpen(true);
                        }}
                        className="w-full text-[11px] py-1.5 h-auto border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 font-bold rounded-xl"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        Registrar Firma Manual
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botón alternativo para firmar si no puede usar el lector */}
            {userHuella && isBiometricSupported && !showSignaturePad && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignaturePad(true);
                    setHuellaStatus("SIN_HUELLA");
                    isSignatureAcceptedRef.current = false;
                    setSignatureDialogOpen(true);
                  }}
                  className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1.5 transition-all py-2 px-4 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/80 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  ¿No puede registrar huella? Registrar Firma Manual
                </button>
              </div>
            )}

            {/* Si no tiene huella/soporte, se renderiza la firma afuera de forma directa sin etiquetas */}
            {(!userHuella || !isBiometricSupported) && (
              <div className="w-full">
                {signatureBase64 ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                      <span className="text-xs font-bold text-green-700">Firma registrada ✓</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        isSignatureAcceptedRef.current = false;
                        setSignatureDialogOpen(true);
                      }}
                      className="text-xs text-primary hover:underline font-bold"
                    >
                      Modificar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      isSignatureAcceptedRef.current = false;
                      setSignatureDialogOpen(true);
                    }}
                    className="w-full py-3 px-4 border border-slate-200 hover:border-primary/50 rounded-2xl text-xs font-bold text-slate-600 hover:text-primary transition-all bg-slate-50 hover:bg-slate-100/30 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    Registrar Firma Manual
                  </button>
                )}
              </div>
            )}

            {/* Comentario exclusivo para la Salida */}
            {currentAction === "Salida" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Observaciones / Comentario de Salida</label>
                <textarea
                  value={checkoutComment}
                  onChange={(e) => setCheckoutComment(e.target.value)}
                  placeholder="Escriba comentarios sobre las actividades de su turno..."
                  className="w-full min-h-[70px] p-3 border border-slate-200 rounded-2xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-slate-800"
                />
              </div>
            )}

            {/* Botones de acción principales */}
            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setDialogOpen(false)}
                className="flex-1 py-2.5 h-auto rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleMarkSubmit}
                disabled={isSubmitting || !location || ((!userHuella || !isBiometricSupported || huellaStatus === "SIN_HUELLA") && !signatureBase64)}
                className="flex-1 py-2.5 h-auto bg-primary hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                )}
                Registrar {currentAction}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo exclusivo para Firma Digital (Evita interferencia con scroll) */}
      <Dialog open={signatureDialogOpen} onOpenChange={(open) => {
        if (open) {
          isSignatureAcceptedRef.current = false;
        } else {
          // Si cierran (por la X o haciendo clic fuera), limpiar firma
          if (!isSignatureAcceptedRef.current) {
            setSignatureBase64("");
          }
        }
        setSignatureDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary">draw</span>
              Registrar Firma Digital
            </DialogTitle>
            <p className="text-[11px] text-slate-500">
              Dibuje su firma en el recuadro a continuación y presione "Aceptar".
            </p>
          </DialogHeader>
          
          <div className="py-2 space-y-4">
            <SignaturePad 
              key={signatureDialogOpen ? "open" : "closed"}
              onChange={setSignatureBase64} 
              disabled={isSubmitting} 
            />
            
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  isSignatureAcceptedRef.current = false;
                  setSignatureBase64(""); // Limpiar explícitamente al hacer clic en Cancelar
                  setSignatureDialogOpen(false);
                }}
                className="flex-1 py-2 h-auto text-xs font-bold rounded-xl text-slate-500"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  isSignatureAcceptedRef.current = true;
                  setSignatureDialogOpen(false);
                }}
                disabled={!signatureBase64}
                className="flex-1 py-2 h-auto bg-primary hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Máscara de Sincronización bloqueante */}
      {isSyncing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center gap-4 select-none">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <span className="material-symbols-outlined text-[20px] text-primary absolute animate-pulse">sync</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Actualizando datos...</h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Sincronizando marca de asistencia con Google Sheets. Espere por favor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
