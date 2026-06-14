import { AuthForm } from '@/components/auth-form';

export default function AuthenticationPage() {
  return (
    <body className="bg-mesh min-h-screen flex flex-col font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md lg:max-w-4xl flex flex-col lg:flex-row glass-panel rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Columna Visual Izquierda (Solo Escritorio) */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary items-center justify-center p-12">
            <div 
              className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
                backgroundSize: '24px 24px' 
              }} 
            />
            <div className="relative z-10 text-white space-y-6">
              <h2 className="text-3xl font-bold leading-tight font-headline">
                Control Eficiente de Personal en Campo
              </h2>
              <p className="text-lg text-primary-fixed opacity-90">
                Gestiona asistencias, turnos y aprobaciones con rigor institucional y tecnología moderna.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="material-symbols-outlined text-primary-fixed">verified_user</span>
                  <span className="text-sm font-semibold">Acceso Seguro y Encriptado</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="material-symbols-outlined text-primary-fixed">location_on</span>
                  <span className="text-sm font-semibold">Geolocalización en Tiempo Real</span>
                </div>
              </div>
            </div>
            
            {/* Elementos decorativos animados de fondo */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl" />
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-warning/10 rounded-full blur-3xl" />
          </div>

          {/* Columna Derecha de Formularios */}
          <div className="w-full lg:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-white/40 backdrop-blur-md">
            <div className="flex items-end justify-center gap-1.5 mb-6">
              <img 
                src="/logo.svg" 
                alt="Logo Institucional ASSAM" 
                className="h-20 w-auto object-contain"
              />
              <span className="text-[10px] font-medium text-on-surface-variant/40 mb-1 select-none">
                v1.2.0
              </span>
            </div>
            <AuthForm />
          </div>

        </div>
      </main>

      <footer className="py-6 px-4 text-center">
        <p className="text-xs text-on-surface-variant opacity-60">
          © {new Date().getFullYear()} ASSAM - Sistema de Gestión Institucional. Todos los derechos reservados.
        </p>
      </footer>
    </body>
  );
}
