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
import { Fingerprint, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
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

// Helpers para convertir buffers WebAuthn a Base64 y viceversa
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
  const [isNativeSupported, setIsNativeSupported] = React.useState(false);

  React.useEffect(() => {
    const supported = typeof window !== "undefined" && 
                      !!navigator.credentials && 
                      !!navigator.credentials.create &&
                      window.isSecureContext;
    setIsNativeSupported(supported);
  }, []);

  // Enrolamiento WebAuthn Real
  const handleNativeEnroll = async () => {
    setScanState("scanning");
    setStatusMessage("Active el sensor de huella/rostro de su dispositivo...");
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const userId = new TextEncoder().encode(userName + "-" + Date.now());
      
      const options: CredentialCreationOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: "ASSAM Control Asistencia",
            id: window.location.hostname
          },
          user: {
            id: userId,
            name: userName,
            displayName: userName
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },   // ES256
            { type: "public-key", alg: -257 }  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Lector nativo
            userVerification: "required"
          },
          timeout: 60000
        }
      };
      
      const credential = await navigator.credentials.create(options) as PublicKeyCredential;
      if (!credential) throw new Error("No se generó la credencial");
      
      const base64Token = bufferToBase64(credential.rawId);
      
      setScanState("success");
      setStatusMessage("¡Huella registrada exitosamente!");
      setTimeout(() => {
        onSuccess(base64Token, "CORRECTA");
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      console.error("WebAuthn Enroll Error:", err);
      setScanState("error");
      setStatusMessage(`Error de registro biométrico: ${err.message || err.name}`);
    }
  };

  // Verificación WebAuthn Real
  const handleNativeVerify = async () => {
    if (!registeredHuella) return;
    setScanState("scanning");
    setStatusMessage("Verificando identidad con el sensor biométrico...");
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      let credentialId: Uint8Array;
      try {
        credentialId = base64ToUint8Array(registeredHuella);
      } catch (e) {
        throw new Error("La huella registrada no tiene formato WebAuthn válido.");
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
      
      setScanState("success");
      setStatusMessage("¡Identidad verificada exitosamente!");
      setTimeout(() => {
        onSuccess(registeredHuella, "CORRECTA");
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      console.error("WebAuthn Verify Error:", err);
      
      if (err.name === "NotAllowedError") {
        setScanState("error");
        setStatusMessage("Verificación cancelada por el usuario");
      } else {
        setScanState("warning");
        setStatusMessage("Error de concordancia biométrica");
        setWarningText(
          `⚠️ La verificación biométrica falló (${err.message}).\n\n¿Desea registrar la asistencia de todas formas bajo advertencia de discrepancia?`
        );
      }
    }
  };

  // Disparar escaneo automático al abrir si es compatible
  React.useEffect(() => {
    if (open) {
      setScanState("idle");
      setWarningText(null);
      
      const supported = typeof window !== "undefined" && 
                        !!navigator.credentials && 
                        !!navigator.credentials.create &&
                        window.isSecureContext;

      if (mode === "enroll") {
        if (supported) {
          setStatusMessage("Iniciando sensor...");
          const timer = setTimeout(() => {
            handleNativeEnroll();
          }, 400);
          return () => clearTimeout(timer);
        } else {
          setScanState("error");
          setStatusMessage("Lector biométrico no disponible en esta conexión/dispositivo. (Se requiere HTTPS o localhost)");
        }
      } else {
        if (!registeredHuella) {
          setScanState("error");
          setStatusMessage("No hay huella registrada para este usuario.");
        } else if (supported) {
          setStatusMessage("Iniciando sensor...");
          const timer = setTimeout(() => {
            handleNativeVerify();
          }, 400);
          return () => clearTimeout(timer);
        } else {
          setScanState("error");
          setStatusMessage("Lector biométrico no disponible en este dispositivo.");
        }
      }
    }
  }, [open, mode, registeredHuella]);

  const handleProceedWithDiscrepancy = () => {
    onSuccess("DISCREPANTE_TOKEN", "DISCREPANCIA");
    onOpenChange(false);
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
              ? "Registre su huella física para habilitar la validación biométrica."
              : `Confirmando identidad para ${userName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center justify-center gap-6">
          
          {/* Lector de huella digital visual */}
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className={cn(
              "absolute inset-0 rounded-full border-2 border-dashed transition-all duration-1000",
              scanState === "scanning" ? "border-primary animate-spin" : "border-slate-200"
            )} />
            
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-inner select-none",
                scanState === "idle" && "bg-slate-50 text-slate-400 border border-slate-200/50",
                scanState === "scanning" && "bg-primary/10 text-primary border border-primary/20 scale-105",
                scanState === "success" && "bg-green-50 text-green-600 border border-green-200",
                scanState === "warning" && "bg-amber-50 text-amber-600 border border-amber-200",
                scanState === "error" && "bg-red-50 text-red-600 border border-red-200"
              )}
            >
              {scanState === "scanning" ? (
                <>
                  <Fingerprint className="w-12 h-12 animate-pulse text-primary" />
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/80 shadow-md shadow-primary top-0 animate-bounce" style={{ animationDuration: '2s' }} />
                </>
              ) : scanState === "success" ? (
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              ) : scanState === "warning" ? (
                <AlertTriangle className="w-12 h-12 text-amber-600" />
              ) : scanState === "error" ? (
                <XCircle className="w-12 h-12 text-red-600" />
              ) : (
                <Fingerprint className="w-12 h-12 text-slate-500" />
              )}
            </div>
          </div>

          {/* Mensaje de estado */}
          <div className="text-center px-4">
            <p className={cn(
              "text-xs font-bold transition-all duration-300 whitespace-pre-line leading-relaxed",
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
                    handleNativeVerify();
                  }}
                  variant="outline"
                  className="flex-1 py-1.5 h-auto text-[11px] border-amber-300 text-amber-700 hover:bg-amber-100/50 font-bold rounded-lg"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Botón de reintento manual si el usuario canceló o hubo error */}
          {scanState === "error" && isNativeSupported && (
            <Button
              onClick={mode === "enroll" ? handleNativeEnroll : handleNativeVerify}
              variant="outline"
              className="py-2 px-4 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar Escaneo
            </Button>
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
