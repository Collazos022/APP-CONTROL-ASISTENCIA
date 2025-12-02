"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Loader2, RefreshCw } from "lucide-react";

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
    if (event.nativeEvent instanceof MouseEvent) {
      return {
        x: event.nativeEvent.clientX - rect.left,
        y: event.nativeEvent.clientY - rect.top,
      };
    }
    if (event.nativeEvent instanceof TouchEvent) {
      return {
        x: event.nativeEvent.touches[0].clientX - rect.left,
        y: event.nativeEvent.touches[0].clientY - rect.top,
      };
    }
  };
  
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
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
        context.strokeStyle = "#1A237E";
        context.lineWidth = 2;
        context.lineCap = "round";
        context.lineJoin = "round";
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
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={375}
        height={200}
        className="rounded-md border border-input bg-card cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={clearCanvas}
          type="button"
          className="w-full"
          disabled={disabled}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
        <Button onClick={handleSave} type="button" className="w-full" disabled={disabled}>
          {disabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar y Enviar
        </Button>
      </div>
    </div>
  );
}
