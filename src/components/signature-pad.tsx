"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface SignaturePadProps {
  onSave: (signature: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ onSave, disabled }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calcular escala en caso de que el canvas se estire por CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (window.TouchEvent && event.nativeEvent instanceof TouchEvent) {
      if (event.nativeEvent.touches.length === 0) return;
      return {
        x: (event.nativeEvent.touches[0].clientX - rect.left) * scaleX,
        y: (event.nativeEvent.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      const mouseEvent = event.nativeEvent as MouseEvent;
      return {
        x: (mouseEvent.clientX - rect.left) * scaleX,
        y: (mouseEvent.clientY - rect.top) * scaleY,
      };
    }
  };
  
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    context.beginPath();
    context.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.strokeStyle = "#171c1f";
        context.lineWidth = 3;
        context.lineCap = "round";
        context.lineJoin = "round";
      }
      
      // Ajustar dimensiones del canvas para que coincida con su tamaño real
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Volver a configurar el contexto después de cambiar ancho/alto
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#171c1f";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
      }
    }
  }, []);

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-4">
      {/* Contenedor del Canvas con Estilo Google Stitch */}
      <div className="canvas-container w-full bg-white rounded-2xl border-2 border-dashed border-outline-variant h-64 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute bottom-2 right-4 pointer-events-none text-slate-400 italic text-xs select-none">
          Firma Digital
        </div>
      </div>
      
      {/* Botones de acción unificados */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={clearCanvas}
          type="button"
          className="py-3 px-6 h-12 rounded-xl border border-slate-300 text-on-surface font-semibold hover:bg-slate-100 transition-colors"
          disabled={disabled}
        >
          Limpiar
        </Button>
        <Button 
          onClick={handleSave} 
          type="button" 
          className="py-3 px-6 h-12 rounded-xl bg-primary text-white font-semibold shadow-lg hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-2" 
          disabled={disabled}
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Confirmar</span>
          )}
        </Button>
      </div>
    </div>
  );
}
