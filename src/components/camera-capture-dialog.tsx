'use client';

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, RefreshCw, Upload, Image as ImageIcon, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (base64Image: string) => void;
}

export function CameraCaptureDialog({ open, onOpenChange, onCapture }: CameraCaptureDialogProps) {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [facingMode, setFacingMode] = React.useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = React.useState(false);

  // Comprobar si hay múltiples cámaras (ej. móvil con frontal y trasera)
  React.useEffect(() => {
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }).catch(err => {
        console.warn("No se pudieron enumerar los dispositivos de video:", err);
      });
    }
  }, []);

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    setCapturedImage(null);
    
    // Detener cualquier stream previo
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Error al acceder a la cámara:", err);
      let errMsg = "No se pudo acceder a la cámara.";
      if (err.name === "NotAllowedError") {
        errMsg = "Permiso denegado para usar la cámara. Por favor, habilita los permisos en tu navegador.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "No se detectó ninguna cámara en este dispositivo.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  React.useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setError(null);
    }
    return () => {
      stopCamera();
    };
  }, [open, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const videoWidth = videoRef.current.videoWidth || 640;
      const videoHeight = videoRef.current.videoHeight || 480;
      
      // Creamos un canvas temporal para extraer el frame del video
      const canvas = document.createElement("canvas");
      
      // Para un avatar cuadrado, recortamos el centro del video en un canvas de 200x200
      const targetSize = 200;
      canvas.width = targetSize;
      canvas.height = targetSize;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Encontrar dimensiones cuadradas centrales
        const size = Math.min(videoWidth, videoHeight);
        const sx = (videoWidth - size) / 2;
        const sy = (videoHeight - size) / 2;
        
        // Dibujar y recortar la imagen de forma cuadrada
        ctx.drawImage(videoRef.current, sx, sy, size, size, 0, 0, targetSize, targetSize);
        
        // Exportar a JPG con compresión para evitar celdas pesadas en Sheets
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Procesar archivo cargado manualmente
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetSize = 200;
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const width = img.width;
          const height = img.height;
          const size = Math.min(width, height);
          const sx = (width - size) / 2;
          const sy = (videoHeight => (height - size) / 2)(); // center crop
          
          ctx.drawImage(img, sx, sy, size, size, 0, 0, targetSize, targetSize);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setCapturedImage(dataUrl);
          stopCamera();
          setLoading(false);
        }
      };
      img.onerror = () => {
        setError("Error al cargar la imagen.");
        setLoading(false);
      };
    };
    reader.onerror = () => {
      setError("Error al leer el archivo.");
      setLoading(false);
    };
  };

  const handleAccept = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onOpenChange(false);
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90%] sm:max-w-sm rounded-3xl p-6 border-white/20 shadow-xl overflow-hidden bg-white">
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-lg text-primary font-bold">
            {capturedImage ? "Vista Previa de Foto" : "Tomar Foto de Perfil"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-2">
          {/* Cámara o Foto capturada */}
          <div className="relative w-64 h-64 rounded-full border-4 border-slate-100 shadow-inner overflow-hidden bg-slate-50 flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}
            
            {error && !capturedImage && (
              <div className="p-4 text-center space-y-2">
                <span className="material-symbols-outlined text-[36px] text-slate-400">photo_camera_off</span>
                <p className="text-[11px] text-slate-500 font-medium leading-normal">{error}</p>
              </div>
            )}

            {!capturedImage && !error && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]" // Espejo para selfie
              />
            )}

            {capturedImage && (
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Botones de control */}
          <div className="w-full flex flex-col gap-2 pt-2">
            {!capturedImage && !error && (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 py-5 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                >
                  <Camera className="h-4 w-4" />
                  Capturar
                </Button>

                {hasMultipleCameras && (
                  <Button
                    onClick={toggleCamera}
                    variant="outline"
                    className="py-5 border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {capturedImage && (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleAccept}
                  className="flex-1 py-5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Check className="h-4 w-4" />
                  Aceptar Foto
                </Button>
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="flex-1 py-5 border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            )}

            {/* Alternativa: Subir Archivo */}
            {!capturedImage && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                className="w-full text-slate-500 hover:text-primary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 h-10"
              >
                <Upload className="h-4 w-4" />
                Subir foto desde archivos
              </Button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!capturedImage && (
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 h-10"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
