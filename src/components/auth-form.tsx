"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
})

const registerSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }),
  identificacion: z.string().min(1, { message: "La identificación es obligatoria." }),
  telefono: z.string().min(1, { message: "El teléfono es obligatorio." }),
  cargo: z.string().min(1, { message: "El cargo es obligatorio." }),
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
})

type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

export function AuthForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState<"login" | "register">("login")
  const [isLoginLoading, setIsLoginLoading] = React.useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = React.useState(false)
  const [cargos, setCargos] = React.useState<{name: string, role: string}[]>([])

  React.useEffect(() => {
    api.fetchAllData().then(data => {
      setCargos(data.cargos || []);
    }).catch(err => {
      console.error("No se pudieron cargar los cargos:", err);
    });
  }, []);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    control: registerControl,
    formState: { errors: registerErrors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  const onLogin = async (data: LoginData) => {
    setIsLoginLoading(true)
    try {
      const user = await api.login(data.email, data.password)
      localStorage.setItem("userRole", user.role.trim())
      localStorage.setItem("userName", user.name)
      localStorage.setItem("userId", user.id)
      localStorage.setItem("userEmail", user.email || "")
      localStorage.setItem("userAvatar", user.avatar || "avatar-1")

      toast({
        title: "Inicio de sesión exitoso",
        description: "Redirigiendo al panel de control...",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales incorrectas o problema de conexión.",
      })
    } finally {
      setIsLoginLoading(false)
    }
  }

  const onRegister = async (data: RegisterData) => {
    setIsRegisterLoading(true)
    try {
      await api.register({
        name: data.name,
        identificacion: data.identificacion,
        telefono: data.telefono,
        cargo: data.cargo,
        email: data.email,
        password: data.password
      })
      toast({
        title: "Registro exitoso",
        description: "Tu solicitud ha sido registrada. Ahora puedes iniciar sesión.",
      })
      setActiveTab("login")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.message || "No se pudo crear la cuenta. Intente de nuevo.",
      })
    } finally {
      setIsRegisterLoading(false)
    }
  }
  
  return (
    <div className="w-full">
      {/* Selector de pestañas deslizable personalizado */}
      <div className="flex bg-slate-200/50 rounded-xl p-1 mb-6 relative select-none">
        <div 
          className={cn(
            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white shadow-sm rounded-lg transition-all duration-300 z-0",
            activeTab === "login" ? "left-1" : "left-[calc(50%+2px)]"
          )}
        />
        <button 
          type="button"
          className={cn(
            "relative z-10 flex-1 py-2 text-sm font-semibold transition-all rounded-lg text-center",
            activeTab === "login" ? "text-primary" : "text-slate-500"
          )}
          onClick={() => setActiveTab("login")}
        >
          Iniciar Sesión
        </button>
        <button 
          type="button"
          className={cn(
            "relative z-10 flex-1 py-2 text-sm font-semibold transition-all rounded-lg text-center",
            activeTab === "register" ? "text-primary" : "text-slate-500"
          )}
          onClick={() => setActiveTab("register")}
        >
          Registrarse
        </button>
      </div>

      {/* Formulario de Login */}
      {activeTab === "login" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-headline text-primary">Bienvenido</h3>
            <p className="text-sm text-slate-500">Ingrese sus credenciales para acceder al sistema.</p>
          </div>
          
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="ejemplo@assam.com"
                className="w-full px-4 py-3 glass-input rounded-t-lg text-sm font-body"
                {...registerLogin("email")}
              />
              {loginErrors.email && (
                <p className="text-xs text-destructive mt-1 ml-1">{loginErrors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 glass-input rounded-t-lg text-sm font-body"
                {...registerLogin("password")}
              />
              {loginErrors.password && (
                <p className="text-xs text-destructive mt-1 ml-1">{loginErrors.password.message}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" 
                />
                <span className="text-xs font-semibold text-slate-500">Recordarme</span>
              </label>
              <a href="#" className="text-xs font-semibold text-primary hover:underline">
                ¿Olvidó su contraseña?
              </a>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Formulario de Registro */}
      {activeTab === "register" && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-headline text-primary">Registro de Personal</h3>
            <p className="text-sm text-slate-500">Complete la información para su alta en campo.</p>
          </div>
          
          <form onSubmit={handleRegisterSubmit(onRegister)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Juan Pérez"
                className="w-full px-4 py-2 glass-input rounded-t-lg text-sm font-body"
                {...registerRegister("name")}
              />
              {registerErrors.name && (
                <p className="text-xs text-destructive mt-1 ml-1">{registerErrors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">ID (Cédula)</label>
              <input
                type="text"
                placeholder="00.000.000"
                className="w-full px-4 py-2 glass-input rounded-t-lg text-sm font-body"
                {...registerRegister("identificacion")}
              />
              {registerErrors.identificacion && (
                <p className="text-xs text-destructive mt-1 ml-1">{registerErrors.identificacion.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Teléfono</label>
              <input
                type="tel"
                placeholder="+54 9..."
                className="w-full px-4 py-2 glass-input rounded-t-lg text-sm font-body"
                {...registerRegister("telefono")}
              />
              {registerErrors.telefono && (
                <p className="text-xs text-destructive mt-1 ml-1">{registerErrors.telefono.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Cargo</label>
              <Controller
                control={registerControl}
                name="cargo"
                render={({ field }) => (
                  <select 
                    className="w-full px-4 py-2 glass-input rounded-t-lg text-sm font-body appearance-none bg-transparent"
                    onChange={field.onChange}
                    value={field.value}
                  >
                    <option value="" disabled>Seleccione cargo</option>
                    {cargos.length > 0 ? (
                      cargos.map((cargo) => (
                        <option key={cargo.name} value={cargo.name}>{cargo.name}</option>
                      ))
                    ) : (
                      <option value="Empleado">Empleado (Cargando...)</option>
                    )}
                  </select>
                )}
              />
              {registerErrors.cargo && (
                <p className="text-xs text-destructive mt-1 ml-1">{registerErrors.cargo.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="personal@assam.com"
                className="w-full px-4 py-2 glass-input rounded-t-lg text-sm font-body"
                {...registerRegister("email")}
              />
              {registerErrors.email && (
                <p className="text-xs text-destructive mt-1 ml-1">{registerErrors.email.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 ml-1">Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-2 glass-input rounded-t-lg text-sm font-body"
                {...registerRegister("password")}
              />
              {registerErrors.password && (
                <p className="text-xs text-destructive mt-1 ml-1">{registerErrors.password.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2 pt-2">
              <Button 
                type="submit" 
                className="w-full py-6 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                disabled={isRegisterLoading}
              >
                {isRegisterLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Solicitar Registro</span>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
