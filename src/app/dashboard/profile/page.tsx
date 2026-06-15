'use client';

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { placeholderImages } from "@/lib/placeholder-images";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BiometricDialog } from "@/components/biometric-dialog";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }),
  telefono: z.coerce.string().min(1, { message: "El teléfono es obligatorio." }),
  email: z.string().email().optional().or(z.literal('')),
  identificacion: z.coerce.string().optional(),
  cargo: z.coerce.string().optional(),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }).optional().or(z.literal('')),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [userId, setUserId] = React.useState("");
  
  // Modificación de Foto de Perfil
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentAvatar, setCurrentAvatar] = React.useState("");
  const [newAvatarBase64, setNewAvatarBase64] = React.useState<string | null>(null);
  
  // Modificación de Huella Digital
  const [currentHuella, setCurrentHuella] = React.useState("");
  const [newHuella, setNewHuella] = React.useState<string | null>(null);
  const [biometricDialogOpen, setBiometricDialogOpen] = React.useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = React.useState(false);

  React.useEffect(() => {
    const supported = typeof window !== "undefined" && 
                      !!navigator.credentials && 
                      !!navigator.credentials.create &&
                      window.isSecureContext;
    setIsBiometricSupported(supported);
  }, []);

  const [isEditing, setIsEditing] = React.useState(false);

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      telefono: "",
      email: "",
      identificacion: "",
      cargo: "",
      password: "",
    },
  });

  const loadProfile = React.useCallback(() => {
    const loggedInUserId = localStorage.getItem("userId") || "user-1";
    setUserId(loggedInUserId);

    api.fetchAllData().then(data => {
      const user = data.usuarios.find(u => u.id === loggedInUserId);
      if (user) {
        form.reset({
          name: user.name,
          telefono: user.telefono || "",
          email: user.email || "",
          identificacion: user.identificacion || "",
          cargo: user.cargo || "",
          password: "",
        });
        setCurrentAvatar(user.avatar || "");
        setCurrentHuella(user.huella || "");
      }
    }).catch(err => {
      console.error("Error cargando perfil:", err);
    }).finally(() => {
      setLoadingProfile(false);
    });
  }, [form]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Redimensionar y comprimir foto a base64 (Max 100x100 px, JPEG)
  const compressImage = (file: File, maxWidth = 100, maxHeight = 100): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6); // 0.6 calidad para reducir peso agresivamente
            resolve(dataUrl);
          } else {
            reject(new Error("No se pudo iniciar el renderizador de Canvas"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Manejar cambio de foto de perfil
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setNewAvatarBase64(compressedBase64);
      setIsEditing(true); // Activa el modo de guardado de cambios
      toast({
        title: "Foto cargada",
        description: "Haz clic en 'Guardar Cambios' para actualizar tu perfil.",
      });
    } catch (err: any) {
      console.error("Error al procesar foto:", err);
      toast({
        variant: "destructive",
        title: "Error de carga",
        description: "No se pudo procesar la imagen elegida."
      });
    }
  };

  const onSubmit = async (data: ProfileData) => {
    setIsLoading(true);
    try {
      const payload: any = {
        userId,
        name: data.name,
        telefono: data.telefono,
        password: data.password || undefined,
      };

      if (newAvatarBase64) {
        payload.avatarUrl = newAvatarBase64;
      }

      if (newHuella !== null) {
        payload.huella = newHuella;
      }

      await api.updateProfile(payload);
      
      // Actualizar localStorage
      localStorage.setItem("userName", data.name);
      if (newAvatarBase64) {
        localStorage.setItem("userAvatar", newAvatarBase64);
        setCurrentAvatar(newAvatarBase64);
        setNewAvatarBase64(null);
      }
      
      if (newHuella !== null) {
        setCurrentHuella(newHuella);
        setNewHuella(null);
      }
      
      toast({
        title: "Perfil Actualizado",
        description: "Tus datos han sido actualizados en Google Sheets.",
      });
      
      form.setValue("password", "");
      setIsEditing(false);

      // Disparar evento de actualización global del Header
      window.dispatchEvent(new Event("refresh-header"));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el perfil.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors: any) => {
    const errorFields = Object.keys(errors).join(", ");
    toast({
      variant: "destructive",
      title: "Revisa el formulario",
      description: `Errores en: ${errorFields}. Asegúrate de que los campos tengan el formato correcto.`,
    });
  };

  if (loadingProfile) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pt-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-64 rounded-3xl" />
          <Skeleton className="lg:col-span-8 h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  // Resolver foto a mostrar
  const displayAvatar = newAvatarBase64 || (
    currentAvatar?.startsWith("data:") || currentAvatar?.startsWith("http")
      ? currentAvatar
      : placeholderImages.find(p => p.id === currentAvatar)?.imageUrl || ""
  );

  return (
    <div className="w-full max-w-full sm:max-w-5xl mx-auto pb-20 min-w-0">
      <div className="space-y-6">
        {/* Title */}
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold font-headline text-primary">Mi Perfil</h1>
          <p className="text-sm text-on-surface-variant">
            Consulta y actualiza tus datos personales de registro de asistencia.
          </p>
        </section>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center border border-white/20 shadow-sm relative overflow-hidden">
              {/* Profile Picture Container */}
              <div className="relative group mt-4">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-surface-container flex items-center justify-center">
                  {displayAvatar ? (
                    <img 
                      src={displayAvatar} 
                      alt="Avatar del Perfil" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {form.getValues("name")?.substring(0, 2).toUpperCase() || "US"}
                    </span>
                  )}
                </div>
                
                {/* Floating camera button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="mt-5 space-y-1">
                <h3 className="text-md font-bold text-on-surface leading-tight">
                  {form.getValues("name")}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">
                  {form.getValues("cargo") || "Empleado"}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 flex items-start gap-3 border border-white/20 text-xs shadow-sm">
              <div className="p-2.5 bg-warning/10 text-warning rounded-xl shrink-0">
                <span className="material-symbols-outlined text-[18px]">security</span>
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-on-surface">Seguridad de la Cuenta</h4>
                <p className="text-on-surface-variant text-[11px] leading-normal">
                  Tus datos están sincronizados en tiempo real con Google Sheets. Para cambiar datos inactivos (ID o Cargo), ponte en contacto con Recursos Humanos.
                </p>
              </div>
            </div>

            {/* Tarjeta de Huella Digital */}
            <div className="glass-card rounded-3xl p-6 border border-white/20 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  (newHuella || currentHuella) ? "bg-green-600/10 text-green-600" : "bg-amber-500/10 text-amber-500"
                )}>
                  <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Huella Digital</h4>
                  <p className="text-[11px] text-on-surface-variant leading-none mt-0.5 font-semibold">
                    {(newHuella || currentHuella) ? "Estado: Registrada" : "Estado: Sin Registrar"}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-on-surface-variant leading-normal">
                {!isBiometricSupported ? (
                  <span className="text-amber-600 font-semibold">Este dispositivo/navegador no soporta biometría nativa WebAuthn. Registrará asistencia utilizando su firma digital.</span>
                ) : (newHuella || currentHuella) 
                  ? "Su huella está enrolada para validar asistencia. Puede volver a registrarla si es necesario." 
                  : "Por favor registre su huella digital para poder marcar Entrada y Salida con verificación biométrica."}
              </div>

              {isBiometricSupported && (
                <Button
                  type="button"
                  onClick={() => setBiometricDialogOpen(true)}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer",
                    (newHuella || currentHuella)
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                      : "bg-primary text-white hover:opacity-90 shadow-md shadow-primary/10"
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                  {(newHuella || currentHuella) ? "Re-registrar Huella" : "Registrar Huella"}
                </Button>
              )}
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-8">
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="glass-card rounded-3xl p-6 border border-white/20 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nombre Completo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nombre Completo *</label>
                  <input
                    type="text"
                    disabled={!isEditing || isLoading}
                    className="w-full px-4 py-2.5 bg-surface-container/60 border border-outline-variant/20 focus:border-primary focus:ring-0 transition-all rounded-xl text-xs text-on-surface font-medium disabled:opacity-70"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-[10px] text-error mt-0.5">{form.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Identificación (Bloqueada) */}
                <div className="space-y-1.5 opacity-80">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Número de Identificación</label>
                  <div className="w-full px-4 py-2.5 bg-surface-container/40 border border-outline-variant/10 rounded-xl text-xs text-on-surface-variant font-bold flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    {form.getValues("identificacion") || "N/A"}
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Teléfono de Contacto *</label>
                  <input
                    type="tel"
                    disabled={!isEditing || isLoading}
                    className="w-full px-4 py-2.5 bg-surface-container/60 border border-outline-variant/20 focus:border-primary focus:ring-0 transition-all rounded-xl text-xs text-on-surface font-medium disabled:opacity-70"
                    {...form.register("telefono")}
                  />
                  {form.formState.errors.telefono && (
                    <p className="text-[10px] text-error mt-0.5">{form.formState.errors.telefono.message}</p>
                  )}
                </div>

                {/* Cargo (Bloqueado) */}
                <div className="space-y-1.5 opacity-80">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cargo Actual</label>
                  <div className="w-full px-4 py-2.5 bg-surface-container/40 border border-outline-variant/10 rounded-xl text-xs text-on-surface-variant font-bold flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    {form.getValues("cargo") || "Empleado"}
                  </div>
                </div>

                {/* Correo Electrónico (Bloqueado) */}
                <div className="space-y-1.5 opacity-80 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Correo Electrónico</label>
                  <div className="w-full px-4 py-2.5 bg-surface-container/40 border border-outline-variant/10 rounded-xl text-xs text-on-surface-variant font-bold flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    {form.getValues("email")}
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nueva Contraseña</label>
                  <input
                    type="password"
                    disabled={!isEditing || isLoading}
                    placeholder={isEditing ? "Dejar en blanco para no modificar" : "••••••••"}
                    className="w-full px-4 py-2.5 bg-surface-container/60 border border-outline-variant/20 focus:border-primary focus:ring-0 transition-all rounded-xl text-xs text-on-surface font-medium disabled:opacity-70"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-[10px] text-error mt-0.5">{form.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3">
                {!isEditing ? (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsEditing(false);
                        setNewAvatarBase64(null);
                        form.reset();
                      }}
                      className="px-6 py-2.5 bg-white border border-outline rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">save</span>
                      )}
                      Guardar Cambios
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <BiometricDialog
        open={biometricDialogOpen}
        onOpenChange={setBiometricDialogOpen}
        mode="enroll"
        onSuccess={async (huellaToken) => {
          setIsLoading(true);
          try {
            await api.updateProfile({
              userId,
              name: form.getValues("name"),
              telefono: form.getValues("telefono"),
              huella: huellaToken
            });
            setCurrentHuella(huellaToken);
            setNewHuella(null);
            toast({
              title: "Huella Guardada",
              description: "Tu huella digital ha sido registrada y guardada exitosamente.",
            });
            window.dispatchEvent(new Event("refresh-header"));
          } catch (error: any) {
            toast({
              variant: "destructive",
              title: "Error al guardar huella",
              description: error.message || "No se pudo registrar la huella en el servidor.",
            });
          } finally {
            setIsLoading(false);
          }
        }}
        onCancel={() => {}}
      />
    </div>
  );
}
