
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const loginSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es obligatoria." }),
})

const cargoEnum = z.enum([
  "Gerente",
  "Coordinador",
  "RRHH",
  "Supervisor Op",
  "Supervisor HSE",
  "Ingeniero Op",
  "Soldador API",
  "Tubero 1",
  "Auxiliar Soldadura",
  "Obrero",
]);

const registerSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }),
  identificacion: z.string().min(1, { message: "La identificación es obligatoria." }),
  telefono: z.string().min(1, { message: "El teléfono es obligatorio." }),
  cargo: cargoEnum,
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
})

type LoginData = z.infer<typeof loginSchema>
type RegisterData = z.infer<typeof registerSchema>

export function AuthForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoginLoading, setIsLoginLoading] = React.useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = React.useState(false)

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
    console.log("Login data:", data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Demo user data
    const demoUsers: {[key: string]: {name: string, role: string}} = {
      "admin@example.com": { name: "Admin User", role: "Administrador"},
      "aprobador@example.com": { name: "Aprobador User", role: "Aprobador"},
      "empleado@example.com": { name: "Empleado User", role: "Empleado"},
      "carlos@example.com": { name: "Carlos Ramirez", role: "Empleado" },
    }
    
    const user = demoUsers[data.email.toLowerCase()] || { name: "Usuario", role: "Empleado"}

    localStorage.setItem("userRole", user.role)
    localStorage.setItem("userName", user.name)


    setIsLoginLoading(false)
    toast({
      title: "Inicio de sesión exitoso",
      description: "Redirigiendo al panel de control...",
    })
    router.push("/dashboard")
  }

  const onRegister = async (data: RegisterData) => {
    setIsRegisterLoading(true)
    console.log("Register data:", data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRegisterLoading(false)
    toast({
      title: "Registro exitoso",
      description: "Ahora puedes iniciar sesión.",
    })
    // In a real app, you might auto-login or switch to the login tab.
  }
  
  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="register">Registrarse</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <form onSubmit={handleLoginSubmit(onLogin)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email-login">Correo Electrónico</Label>
              <Input
                id="email-login"
                type="email"
                placeholder="nombre@ejemplo.com"
                {...registerLogin("email")}
              />
              {loginErrors.email && <p className="text-xs text-destructive">{loginErrors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password-login">Contraseña</Label>
              </div>
              <Input id="password-login" type="password" {...registerLogin("password")} />
              {loginErrors.password && <p className="text-xs text-destructive">{loginErrors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </div>
        </form>
      </TabsContent>
      <TabsContent value="register">
        <form onSubmit={handleRegisterSubmit(onRegister)}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" placeholder="Tu Nombre" {...registerRegister("name")} />
              {registerErrors.name && <p className="text-xs text-destructive">{registerErrors.name.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="identificacion">Identificación</Label>
              <Input id="identificacion" placeholder="Tu Identificación" {...registerRegister("identificacion")} />
              {registerErrors.identificacion && <p className="text-xs text-destructive">{registerErrors.identificacion.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" placeholder="Tu Teléfono" {...registerRegister("telefono")} />
              {registerErrors.telefono && <p className="text-xs text-destructive">{registerErrors.telefono.message}</p>}
            </div>
             <div className="grid gap-1">
              <Label htmlFor="cargo">Cargo</Label>
              <Controller
                control={registerControl}
                name="cargo"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="cargo">
                      <SelectValue placeholder="Selecciona un cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargoEnum.options.map((cargo) => (
                        <SelectItem key={cargo} value={cargo}>
                          {cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {registerErrors.cargo && <p className="text-xs text-destructive">{registerErrors.cargo.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="email-register">Correo Electrónico</Label>
              <Input
                id="email-register"
                type="email"
                placeholder="nombre@ejemplo.com"
                {...registerRegister("email")}
              />
              {registerErrors.email && <p className="text-xs text-destructive">{registerErrors.email.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password-register">Contraseña</Label>
              <Input id="password-register" type="password" {...registerRegister("password")} />
              {registerErrors.password && <p className="text-xs text-destructive">{registerErrors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isRegisterLoading}>
              {isRegisterLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cuenta
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  )
}
