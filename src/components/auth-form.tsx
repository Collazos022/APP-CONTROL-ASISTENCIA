"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { BiometricDialog } from "./biometric-dialog"
import { CameraCaptureDialog } from "./camera-capture-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [enrolledHuella, setEnrolledHuella] = React.useState<string>("")
  const [biometricDialogOpen, setBiometricDialogOpen] = React.useState(false)
  const [registeredPhoto, setRegisteredPhoto] = React.useState<string>("")
  const [cameraDialogOpen, setCameraDialogOpen] = React.useState(false)
  const [inactiveUserDialogOpen, setInactiveUserDialogOpen] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)

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
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRemember = localStorage.getItem("assam_remember_me") === "true";
      setRememberMe(savedRemember);
      if (savedRemember) {
        const savedEmail = localStorage.getItem("assam_remembered_email") || "";
        const savedPassword = localStorage.getItem("assam_remembered_password") || "";
        setLoginValue("email", savedEmail);
        setLoginValue("password", savedPassword);
      }
    }
  }, [setLoginValue]);

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    control: registerControl,
    formState: { errors: registerErrors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      identificacion: "",
      telefono: "",
      cargo: "",
      email: "",
      password: "",
    }
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

      if (rememberMe) {
        localStorage.setItem("assam_remember_me", "true")
        localStorage.setItem("assam_remembered_email", data.email)
        localStorage.setItem("assam_remembered_password", data.password)
      } else {
        localStorage.removeItem("assam_remember_me")
        localStorage.removeItem("assam_remembered_email")
        localStorage.removeItem("assam_remembered_password")
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Redirigiendo al panel de control...",
      })
      router.push("/dashboard")
    } catch (error: any) {
      if (error.message === "INACTIVE_USER") {
        setInactiveUserDialogOpen(true)
      } else {
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: error.message || "Credenciales incorrectas o problema de conexión.",
        })
      }
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
        password: data.password,
        huella: enrolledHuella || undefined,
        avatarUrl: registeredPhoto || undefined
      })
      toast({
        title: "Registro exitoso",
        description: "Tu solicitud ha sido registrada. Ahora puedes iniciar sesión.",
      })
      setEnrolledHuella("")
      setRegisteredPhoto("")
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
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
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
            {/* Foto de Perfil */}
            <div className="md:col-span-2 flex flex-col items-center justify-center space-y-2 pb-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-2 border-slate-100 shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
                  {registeredPhoto ? (
                    <img 
                      src={registeredPhoto} 
                      alt="Foto de Registro" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[36px] text-slate-400">person</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setCameraDialogOpen(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                </button>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Foto de Perfil (Opcional)</span>
            </div>

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

            {/* Registro de Huella Digital */}
            <div className="md:col-span-2 space-y-1 mt-2">
              <label className="text-xs font-semibold text-slate-500 ml-1 block">Registra tu Huella Digital</label>
              {enrolledHuella ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700 text-xs font-bold">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>✓ Huella Digital Enrolada Exitosamente</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBiometricDialogOpen(true)}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Re-registrar
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => setBiometricDialogOpen(true)}
                  variant="outline"
                  className="w-full py-3 h-auto border-dashed border-primary/40 hover:bg-primary/5 text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                  <span>Registrar Huella Digital ahora</span>
                </Button>
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

      <BiometricDialog
        open={biometricDialogOpen}
        onOpenChange={setBiometricDialogOpen}
        mode="enroll"
        onSuccess={(huellaToken) => {
          setEnrolledHuella(huellaToken);
          toast({
            title: "Huella Enrolada",
            description: "La huella digital ha sido capturada de forma exitosa.",
          });
        }}
        onCancel={() => {}}
      />

      <CameraCaptureDialog
        open={cameraDialogOpen}
        onOpenChange={setCameraDialogOpen}
        onCapture={(base64) => {
          setRegisteredPhoto(base64);
          toast({
            title: "Foto capturada",
            description: "Tu foto de perfil se ha añadido al registro.",
          });
        }}
      />

      {/* Modal de Advertencia para Usuario Inactivo */}
      <Dialog open={inactiveUserDialogOpen} onOpenChange={setInactiveUserDialogOpen}>
        <DialogContent className="max-w-md w-[90%] sm:max-w-sm rounded-3xl p-6 border-white/20 shadow-xl overflow-hidden bg-white">
          <DialogHeader className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-full">
              <ShieldAlert className="h-10 w-10 animate-bounce" />
            </div>
            <DialogTitle className="text-center font-headline text-lg text-red-600 font-bold">
              Acceso Denegado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Tu cuenta se encuentra actualmente desactivada. Para reactivar tu acceso, por favor ponte en contacto con Recursos Humanos (RRHH).
            </p>
            <Button
              onClick={() => setInactiveUserDialogOpen(false)}
              className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
