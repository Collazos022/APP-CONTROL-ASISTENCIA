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
import { Fingerprint, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
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
    // Verificar si el navegador soporta WebAuthn y estamos en un contexto seguro (HTTPS / localhost)
    const supported = typeof window !== "undefined" && 
                      !!navigator.credentials && 
                      !!navigator.credentials.create &&
                      window.isSecureContext;
    setIsNativeSupported(supported);
  }, []);

  React.useEffect(() => {
    if (open) {
      setScanState("idle");
      setWarningText(null);
      
      const supported = typeof window !== "undefined" && 
                        !!navigator.credentials && 
                        !!navigator.credentials.create &&
                        window.isSecureContext;

      if (mode === "enroll") {
        setStatusMessage(
          supported 
            ? "Presione 'Usar Sensor del Dispositivo' para capturar su huella digital" 
            : "Registro biométrico simulado (WebAuthn requiere HTTPS/conexión segura)"
        );
      } else {
        if (!registeredHuella) {
          setStatusMessage("No hay huella registrada para este usuario. Se marcará asistencia sin huella.");
          setScanState("warning");
        } else {
          setStatusMessage(
            supported
              ? "Verifique su identidad utilizando el lector biométrico nativo"
              : "Verificación simulada (WebAuthn requiere HTTPS/conexión segura)"
          );
        }
      }
    }
  }, [open, mode, registeredHuella]);

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
            authenticatorAttachment: "platform", // Fuerza lector del celular/computadora (huella, FaceID, PIN)
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
      setScanState("warning");
      setStatusMessage("Registro nativo cancelado");
      setWarningText(
        `No se pudo completar el registro biométrico nativo (${err.name}: ${err.message}).\n\n¿Desea completar el enrolamiento utilizando el simulador de pruebas?`
      );
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
        throw new Error("La huella registrada no tiene formato WebAuthn válido (es de simulación).");
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
        setTimeout(() => {
          setScanState("idle");
          setStatusMessage("Coloque su huella en el lector o use los controles de simulación");
        }, 1500);
      } else {
        setScanState("warning");
        setStatusMessage("Error de concordancia biométrica");
        setWarningText(
          `⚠️ La verificación biométrica falló (${err.message}).\n\n¿Desea registrar la asistencia de todas formas bajo advertencia de discrepancia?`
        );
      }
    }
  };

  // Simulación de escaneo para pruebas
  const startScanning = (simulationResult: "success" | "mismatch" | "no_fingerprint") => {
    setScanState("scanning");
    setStatusMessage("Escaneando huella... mantenga apoyado el dedo");

    setTimeout(() => {
      if (simulationResult === "success") {
        setScanState("success");
        setStatusMessage("¡Huella verificada correctamente!");
        setTimeout(() => {
          onSuccess(registeredHuella || `huella-mock-${Date.now()}`, "CORRECTA");
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
    setStatusMessage("Registrando huella biométrica simulada...");
    setTimeout(() => {
      setScanState("success");
      setStatusMessage("¡Huella simulada guardada!");
      setTimeout(() => {
        onSuccess(`huella-mock-${Date.now()}`, "CORRECTA");
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

        <div className="py-4 flex flex-col items-center justify-center gap-6">
          {/* Alerta de Conexión Insegura / Sin Soporte */}
          {!isNativeSupported && scanState === "idle" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 max-w-sm mx-auto">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-600 leading-normal">
                <strong>Simulación Activada:</strong> El dispositivo no soporta biometría nativa WebAuthn en esta conexión. Se requiere HTTPS o localhost para solicitar permisos al sensor físico.
              </p>
            </div>
          )}

          {/* Lector de huella digital visual */}
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className={cn(
              "absolute inset-0 rounded-full border-2 border-dashed transition-all duration-1000",
              scanState === "scanning" ? "border-primary animate-spin" : "border-slate-200"
            )} />
            
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
                  if (isNativeSupported) {
                    if (mode === "enroll") handleNativeEnroll();
                    else if (registeredHuella) handleNativeVerify();
                  } else {
                    if (mode === "enroll") handleEnrollSuccess();
                    else if (registeredHuella) startScanning("success");
                  }
                }
              }}
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
                    setStatusMessage(
                      isNativeSupported 
                        ? "Coloque su huella en el lector biométrico nativo" 
                        : "Coloque su huella en el lector o use los controles de simulación"
                    );
                  }}
                  variant="outline"
                  className="flex-1 py-1.5 h-auto text-[11px] border-amber-300 text-amber-700 hover:bg-amber-100/50 font-bold rounded-lg"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Acciones principales basadas en soporte nativo */}
          {isNativeSupported && scanState === "idle" && (
            <div className="w-full px-2 flex flex-col gap-2 mt-2">
              <Button
                onClick={mode === "enroll" ? handleNativeEnroll : handleNativeVerify}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">touch_app</span>
                {mode === "enroll" ? "Usar Sensor del Dispositivo" : "Validar con Sensor Nativo"}
              </Button>
            </div>
          )}

          {/* Controles de Simulación para desarrollo y pruebas */}
          {scanState === "idle" && (
            <div className="w-full border-t border-slate-100 pt-4 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2">
                Controles de Simulación (Pruebas)
              </span>
              <div className="flex flex-col gap-2 w-full px-2">
                {mode === "enroll" ? (
                  <Button
                    onClick={handleEnrollSuccess}
                    variant="outline"
                    className="w-full text-[11px] py-2 h-auto text-primary hover:bg-primary/5 border-primary/25 font-bold"
                  >
                    Simular Registro de Huella Exitoso
                  </Button>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          )}

          {mode === "verify" && !registeredHuella && scanState === "idle" && (
            <div className="w-full">
              <Button
                onClick={() => {
                  onSuccess("", "SIN_HUELLA");
                  onOpenChange(false);
                }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Proceder sin Huella
              </Button>
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
