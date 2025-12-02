"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

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
    formState: { errors: registerErrors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  const onLogin = async (data: LoginData) => {
    setIsLoginLoading(true)
    console.log("Login data:", data)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    // Simulate role based on email for demo
    if (data.email.includes("admin")) {
        localStorage.setItem("userRole", "Administrador")
    } else if (data.email.includes("aprobador")) {
        localStorage.setItem("userRole", "Aprobador")
    } else {
        localStorage.setItem("userRole", "Empleado")
    }

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
              <Label htmlFor="email">Correo Electrónico</Label>
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
                <Label htmlFor="password">Contraseña</Label>
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
              <Input id="cargo" placeholder="Tu Cargo" {...registerRegister("cargo")} />
              {registerErrors.cargo && <p className="text-xs text-destructive">{registerErrors.cargo.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email-register"
                type="email"
                placeholder="nombre@ejemplo.com"
                {...registerRegister("email")}
              />
              {registerErrors.email && <p className="text-xs text-destructive">{registerErrors.email.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">Contraseña</Label>
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
