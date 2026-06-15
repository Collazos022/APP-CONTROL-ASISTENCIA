"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Fingerprint, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BiometricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "enroll" | "verify";
  registeredHuella?: string;
  userName?: string;
  onSuccess: (huellaToken: string, status: "CORRECTA" | "DISCREPANCIA" | "SIN_HUELLA") => void;
  onCancel: () => void;
}

export function BiometricDialog({
  open,
  onOpenChange,
  mode,
  registeredHuella,
  userName = "Usuario",
  onSuccess,
  onCancel,
}: BiometricDialogProps) {
  const [scanState, setScanState] = React.useState<"idle" | "scanning" | "success" | "warning" | "error">("idle");
  const [statusMessage, setStatusMessage] = React.useState("");
  const [warningText, setWarningText] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setScanState("idle");
      setWarningText(null);
      if (mode === "enroll") {
        setStatusMessage("Presione el botón para simular captura de huella");
      } else {
        setStatusMessage(
          registeredHuella
            ? "Coloque su huella en el lector o use los controles de simulación"
            : "No hay huella registrada para este usuario. Se marcará asistencia sin huella."
        );
        if (!registeredHuella) {
          setScanState("warning");
        }
      }
    }
  }, [open, mode, registeredHuella]);

  // Simulación de escaneo
  const startScanning = (simulationResult: "success" | "mismatch" | "no_fingerprint") => {
    setScanState("scanning");
    setStatusMessage("Escaneando huella... mantenga apoyado el dedo");

    setTimeout(() => {
      if (simulationResult === "success") {
        setScanState("success");
        setStatusMessage("¡Huella verificada correctamente!");
        setTimeout(() => {
          onSuccess(registeredHuella || `huella-${Date.now()}`, "CORRECTA");
          onOpenChange(false);
        }, 1200);
      } else if (simulationResult === "mismatch") {
        setScanState("warning");
        setStatusMessage("Error de concordancia");
        setWarningText(
          "⚠️ La huella escaneada no coincide con la registrada para este usuario.\n¿Desea registrar la marca de todas formas con una advertencia de discrepancia?"
        );
      } else {
        setScanState("error");
        setStatusMessage("Lector vacío / Cancelado");
        setTimeout(() => {
          onSuccess("", "SIN_HUELLA");
          onOpenChange(false);
        }, 1200);
      }
    }, 1500);
  };

  const handleProceedWithDiscrepancy = () => {
    onSuccess("DISCREPANTE_TOKEN", "DISCREPANCIA");
    onOpenChange(false);
  };

  const handleEnrollSuccess = () => {
    setScanState("scanning");
    setStatusMessage("Registrando huella biométrica...");
    setTimeout(() => {
      setScanState("success");
      setStatusMessage("¡Huella guardada exitosamente!");
      setTimeout(() => {
        onSuccess(`huella-reg-${Date.now()}`, "CORRECTA");
        onOpenChange(false);
      }, 1200);
    }, 1500);
  };

  const handleClose = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-6 bg-white border border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="text-center flex flex-col items-center">
          <DialogTitle className="text-xl font-bold font-headline text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">fingerprint</span>
            {mode === "enroll" ? "Registro de Huella Digital" : "Verificación de Huella"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {mode === "enroll"
              ? "Enrole su huella para habilitar la validación biométrica en sus marcas."
              : `Confirmando identidad para ${userName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center gap-6">
          {/* Lector de huella digital visual */}
          <div className="relative flex items-center justify-center w-32 h-32">
            {/* Círculos de fondo concéntricos */}
            <div className={cn(
              "absolute inset-0 rounded-full border-2 border-dashed transition-all duration-1000",
              scanState === "scanning" ? "border-primary animate-spin" : "border-slate-200"
            )} />
            
            {/* Botón/Lector principal */}
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-inner cursor-pointer select-none",
                scanState === "idle" && "bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200/50",
                scanState === "scanning" && "bg-primary/10 text-primary border border-primary/20 scale-105",
                scanState === "success" && "bg-green-50 text-green-600 border border-green-200",
                scanState === "warning" && "bg-amber-50 text-amber-600 border border-amber-200",
                scanState === "error" && "bg-red-50 text-red-600 border border-red-200"
              )}
              onClick={() => {
                if (scanState === "idle") {
                  if (mode === "enroll") {
                    handleEnrollSuccess();
                  } else if (registeredHuella) {
                    startScanning("success");
                  }
                }
              }}
            >
              {scanState === "scanning" ? (
                <>
                  <Fingerprint className="w-12 h-12 animate-pulse text-primary" />
                  {/* Láser de escaneo */}
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/80 shadow-md shadow-primary top-0 animate-bounce" style={{ animationDuration: '2s' }} />
                </>
              ) : scanState === "success" ? (
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              ) : scanState === "warning" ? (
                <AlertTriangle className="w-12 h-12 text-amber-600" />
              ) : scanState === "error" ? (
                <XCircle className="w-12 h-12 text-red-600" />
              ) : (
                <Fingerprint className="w-12 h-12 hover:scale-105 transition-all duration-300 text-slate-500" />
              )}
            </div>
          </div>

          {/* Mensaje de estado */}
          <div className="text-center px-4">
            <p className={cn(
              "text-sm font-bold transition-all duration-300",
              scanState === "idle" && "text-slate-600",
              scanState === "scanning" && "text-primary animate-pulse",
              scanState === "success" && "text-green-600",
              scanState === "warning" && "text-amber-600",
              scanState === "error" && "text-red-600"
            )}>
              {statusMessage}
            </p>
          </div>

          {/* Advertencia / Decisión en caso de discrepancia */}
          {warningText && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-3">
              <p className="text-xs text-amber-800 whitespace-pre-line leading-relaxed font-medium">
                {warningText}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleProceedWithDiscrepancy}
                  className="flex-1 py-1.5 h-auto text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Sí, Registrar igualmente
                </Button>
                <Button
                  onClick={() => {
                    setScanState("idle");
                    setWarningText(null);
                    setStatusMessage("Coloque su huella en el lector o use los controles de simulación");
                  }}
                  variant="outline"
                  className="flex-1 py-1.5 h-auto text-[11px] border-amber-300 text-amber-700 hover:bg-amber-100/50 font-bold rounded-lg"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Controles de Simulación (solo en modo VERIFY y si tiene huella registrada) */}
          {mode === "verify" && registeredHuella && scanState === "idle" && (
            <div className="w-full border-t border-slate-100 pt-4 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2">
                Simulación de Pruebas (Desarrollo)
              </span>
              <div className="flex flex-col gap-2 w-full px-2">
                <Button
                  onClick={() => startScanning("success")}
                  variant="outline"
                  className="w-full text-[11px] py-2 h-auto text-green-700 hover:bg-green-50 border-green-200 font-bold justify-start gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Simular Huella Correcta (Mismo dedo)
                </Button>
                <Button
                  onClick={() => startScanning("mismatch")}
                  variant="outline"
                  className="w-full text-[11px] py-2 h-auto text-amber-700 hover:bg-amber-50 border-amber-200 font-bold justify-start gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Simular Huella Diferente (Mismatch)
                </Button>
                <Button
                  onClick={() => startScanning("no_fingerprint")}
                  variant="outline"
                  className="w-full text-[11px] py-2 h-auto text-red-700 hover:bg-red-50 border-red-200 font-bold justify-start gap-2"
                >
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  Simular Cancelar / Sin Huella
                </Button>
              </div>
            </div>
          )}

          {/* Botones principales del modal en modo ENROLL o cuando no hay huella */}
          {mode === "enroll" && scanState === "idle" && (
            <Button
              onClick={handleEnrollSuccess}
              className="w-full py-2 bg-primary text-white rounded-xl font-bold text-xs"
            >
              Simular Captura Biométrica
            </Button>
          )}

          {mode === "verify" && !registeredHuella && (
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={() => {
                  onSuccess("", "SIN_HUELLA");
                  onOpenChange(false);
                }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Proceder sin Huella
              </Button>
              <p className="text-[10px] text-center text-slate-400">
                Puedes registrar tu huella más tarde desde la pantalla de Perfil.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 pt-3 flex justify-end">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="text-xs text-slate-500 hover:bg-slate-100 rounded-xl"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
