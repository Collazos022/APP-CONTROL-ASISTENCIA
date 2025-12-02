"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, Loader2, MapPin, X } from "lucide-react";
import { type CheckInType } from "@/lib/types";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [location, setLocation] = React.useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentAction, setCurrentAction] = React.useState<CheckInType | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleActionClick = (action: CheckInType) => {
    setCurrentAction(action);
    setDialogOpen(true);
    setIsSubmitting(false); // Reset submitting state
    setLocation(null);
    setLocationError(null);
    
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
          setLocationError(`Error de GPS: ${error.message}`);
        }
      );
    } else {
      setLocationError("Geolocalización no es soportada por este navegador.");
    }
  };

  const handleSignatureSubmit = async (signature: string) => {
    if (!location) {
        toast({
            variant: "destructive",
            title: "Error de Ubicación",
            description: "No se pudo obtener la ubicación GPS. Intente de nuevo.",
        });
        return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    console.log({
        action: currentAction,
        timestamp: new Date(),
        location,
        signature,
    });
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setDialogOpen(false);
    
    toast({
      title: "Registro Exitoso",
      description: `Se ha registrado su ${currentAction?.toLowerCase()} a las ${new Date().toLocaleTimeString()}.`,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold font-headline">
            Control de Asistencia
          </CardTitle>
          <Clock className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {currentTime.toLocaleTimeString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {currentTime.toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="mt-6 flex space-x-4">
            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleActionClick("Entrada")}
            >
              <Check className="mr-2 h-5 w-5" /> Marcar Entrada
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="flex-1"
              onClick={() => handleActionClick("Salida")}
            >
              <X className="mr-2 h-5 w-5" /> Marcar Salida
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar {currentAction}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h4 className="font-semibold">Firma Digital</h4>
              <p className="text-sm text-muted-foreground">Por favor, firme en el recuadro de abajo.</p>
            </div>
             {location && (
                <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 text-green-500"/>
                    <span>Ubicación GPS capturada.</span>
                </div>
            )}
            {locationError && (
                <div className="flex items-center text-sm text-destructive">
                    <MapPin className="h-4 w-4 mr-2"/>
                    <span>{locationError}</span>
                </div>
            )}
            <SignaturePad onSave={handleSignatureSubmit} disabled={isSubmitting || !location} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
