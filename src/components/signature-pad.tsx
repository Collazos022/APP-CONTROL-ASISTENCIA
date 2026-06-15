"use client";

import * as React from "react";
import { Button } from "./ui/button";

interface SignaturePadProps {
  onChange: (signature: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ onChange, disabled }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
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
    
    // Exportar base64 al levantar el dedo/mouse
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onChange(dataUrl);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange(""); // Vaciar la firma
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
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#171c1f";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
      }
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="canvas-container w-full bg-white rounded-2xl border-2 border-dashed border-outline-variant h-40 relative overflow-hidden">
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
          Dibuje su firma aquí (Opcional)
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={clearCanvas}
          type="button"
          className="py-1 px-3 h-8 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
          disabled={disabled}
        >
          Limpiar Firma
        </Button>
      </div>
    </div>
  );
}
