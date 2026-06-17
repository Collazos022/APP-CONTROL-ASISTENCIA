'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isIos, setIsIos] = React.useState(false);
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    // 1. Detectar si ya está en modo autónomo (instalado)
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isRunningStandalone);

    // 2. Detectar si es un dispositivo iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(detectIos);

    // 3. Escuchar el evento de instalación nativo (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Guardar el evento para dispararlo después
      setDeferredPrompt(e);
      
      // Mostrar la ventana emergente si no ha sido descartada antes
      const isDismissed = localStorage.getItem('assam_pwa_prompt_dismissed');
      if (!isDismissed && !isRunningStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Mostrar banner explicativo en iOS si entra desde el navegador estándar y no está descartado
    if (detectIos && !isRunningStandalone) {
      const isDismissed = localStorage.getItem('assam_pwa_prompt_dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Disparar el prompt de instalación nativo
    deferredPrompt.prompt();
    
    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    
    // Limpiar el prompt diferido
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Recordar el descarte del prompt para que no vuelva a molestar al usuario
    localStorage.setItem('assam_pwa_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 flex justify-center animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-5 flex flex-col gap-4 pointer-events-auto">
        <div className="flex gap-4 items-start">
          {/* Icono de la App */}
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
            <img src="/logo.svg" alt="ASSAM Logo" className="w-8 h-8" />
          </div>

          <div className="flex-1 flex flex-col gap-0.5">
            <h4 className="text-sm font-bold text-on-surface leading-tight">Instalar Aplicación ASSAM</h4>
            <p className="text-xs text-on-surface-variant/80 leading-normal">
              Agrega ASSAM a tu pantalla de inicio para registrar tu asistencia de forma más rápida y sin consumir datos extra.
            </p>
          </div>

          {/* Botón Cerrar */}
          <button 
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5 text-on-surface-variant/60 transition-all"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {isIos ? (
          /* Mensaje exclusivo para iOS (Safari) */
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-[11px] text-on-surface leading-normal">
              Para instalar en tu iPhone o iPad:
            </p>
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/90 font-bold uppercase tracking-wider bg-white/50 px-2 py-1.5 rounded-lg border border-white/50">
              <span>1. Pulsa compartir</span>
              <span className="material-symbols-outlined text-sm font-bold">share</span>
              <span>2. Selecciona "Añadir a pantalla de inicio"</span>
              <span className="material-symbols-outlined text-sm font-bold">add_box</span>
            </div>
          </div>
        ) : (
          /* Botón para Android / Chrome de Escritorio */
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="text-xs h-9 px-4 rounded-xl font-bold border-outline text-on-surface-variant hover:bg-surface-container transition-all active:scale-95"
            >
              Quizás más tarde
            </Button>
            <Button 
              onClick={handleInstallClick}
              className="text-xs h-9 px-4 rounded-xl font-bold bg-primary hover:bg-primary-container text-white transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Instalar App
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
