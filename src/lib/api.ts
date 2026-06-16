import { CheckInRecord, User, Role, CheckInStatus, CheckInType } from "./types";
import { MOCK_RECORDS } from "./mock-data";

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

// Claves para LocalStorage en caso de usar fallback
const STORAGE_KEYS = {
  RECORDS: "assam_records",
  USERS: "assam_users",
  CARGOS: "assam_cargos",
  FRENTES: "assam_frentes",
};

// Cargar datos iniciales del almacenamiento local o usar MOCK_RECORDS
function getLocalStorageData<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(stored) as T;
  } catch (e) {
    return defaultVal;
  }
}

function saveLocalStorageData<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

// Inicializar datos mock en localStorage si no existen
const mockUsers = [
  { id: 'carlos@example.com', name: 'Carlos Ramirez', email: 'carlos@example.com', role: 'Empleado' as Role, avatar: 'avatar-1', cargo: 'Gerente', huellaRegistrada: 'SI', estado: 'Activo' },
];

const mockCargos = [
  { name: 'Gerente', role: 'Administrador' as Role },
];

const mockFrentes = [
  { name: 'Frente A', coords: '4.60971, -74.08175', radio: 100 },
];

export interface AppData {
  registros: CheckInRecord[];
  usuarios: User[];
  cargos: { name: string; role: Role }[];
  frentes: { name: string; coords: string; radio: number }[];
  permisos: { label: string; roles: Role[] }[];
}

export const api = {
  isConfigured(): boolean {
    return API_URL !== "" && API_URL.startsWith("https://script.google.com");
  },

  async fetchAllData(): Promise<AppData> {
    if (!this.isConfigured()) {
      console.warn("API_URL de Google Sheets no configurada. Usando almacenamiento local simulado.");
      const recordsRaw = getLocalStorageData<any[]>(STORAGE_KEYS.RECORDS, MOCK_RECORDS);
      const records = recordsRaw.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }));
      const usuarios = getLocalStorageData<User[]>(STORAGE_KEYS.USERS, mockUsers);
      const cargos = getLocalStorageData<{ name: string; role: Role }[]>(STORAGE_KEYS.CARGOS, mockCargos);
      const frentes = getLocalStorageData<{ name: string; coords: string; radio: number }[]>(STORAGE_KEYS.FRENTES, mockFrentes);
      
      return { registros: records, usuarios, cargos, frentes, permisos: [] };
    }

    try {
      // Usar cache-busting para siempre obtener los datos más recientes desde Google Sheets
      const response = await fetch(`${API_URL}?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error("Error en la petición a Google Sheets");
      const data = await response.json();
      if (data.status === "success") {
        
        // Mapear Usuarios
        const usuarios = (data.usuarios || []).map((u: any) => {
          const fotoKey = Object.keys(u).find(k => k.trim().toLowerCase() === 'foto') || 'Foto';
          const avatarKey = Object.keys(u).find(k => k.trim().toLowerCase() === 'avatar') || 'Avatar';
          
          return {
            id: u.Email_Usuario || u.id,
            name: u.Nombre_Apellido || u.name || "Usuario",
            email: u.Email_Usuario || u.email || "",
            role: (u.Rol_App || u.rol || "Empleado") as Role,
            avatar: u[fotoKey] || u[avatarKey] || u.avatar || "avatar-1",
            identificacion: u.Identificacion || u.identificacion || "",
            telefono: u.Telefono || u.telefono || "",
            cargo: u.Cargo || u.cargo || "",
            huella: u.Huella_ID_Credencial || "",
            huellaRegistrada: u.Huella_Registrada || "NO",
            estado: u.Estado || "Activo"
          };
        });

        // Construir diccionario rápido de usuarios para nombre y avatar
        const usersDict: Record<string, any> = {};
        usuarios.forEach((u: any) => { usersDict[u.id] = u; });

        // Mapear Registros_HT (Virtualizar en Entrada y Salida)
        const registros: CheckInRecord[] = [];
        (data.registros || []).forEach((r: any) => {
          const uEmail = r.Email_Usuario || r.userId;
          const uInfo = usersDict[uEmail] || { name: uEmail, avatar: "avatar-1" };
          const baseId = r.ID_Registro || r.id;

          const hasEntrada = !!r.Hora_Entrada;
          const hasSalida = !!r.Hora_Salida;
          if (!hasEntrada && !hasSalida) return;

          let dateStr = r.Fecha;
          if (dateStr && typeof dateStr === 'string' && dateStr.includes('T')) dateStr = dateStr.split('T')[0];

          let tEntrada = r.Hora_Entrada;
          let tSalida = r.Hora_Salida;
          
          if (tEntrada && typeof tEntrada === 'string' && !tEntrada.includes('T')) tEntrada = `${dateStr}T${tEntrada}:00`;
          if (tSalida && typeof tSalida === 'string' && !tSalida.includes('T')) tSalida = `${dateStr}T${tSalida}:00`;

          registros.push({
            id: baseId,
            userId: uEmail,
            userName: uInfo.name,
            timestamp: new Date(tEntrada || tSalida),
            timestampEntrada: tEntrada ? new Date(tEntrada) : undefined,
            timestampSalida: tSalida ? new Date(tSalida) : undefined,
            location: {
              latitude: parseFloat(r.Latitud || r.latitude) || 0,
              longitude: parseFloat(r.Longitud || r.longitude) || 0
            },
            distanceFromPost: r.distanceFromPost ? parseInt(r.distanceFromPost) : null,
            signatureUrlEntrada: r.Firma_Entrada || "",
            signatureUrlSalida: r.Firma_Salida || "",
            status: (r.Aprobacion || r.status || "Pendiente") as CheckInStatus,
            comments: r.Comentarios || r.Comentario || r.comments || "",
            approvedBy: r.Aprobador || r.Email_Sup || r.approvedBy || "",
            userAvatar: uInfo.avatar,
            employeeComments: r.Comentarios || r.Comentario || r.comments || "",
            hoursWorked: parseFloat(r.Horas_Trabajadas) || 0,
            hoursExtra: parseFloat(r.Horas_Extra) || 0,
            huellaEntrada: r.Huella_Entrada || "",
            huellaSalida: r.Huella_Salida || ""
          });
        });

        // Ordenar por timestamp descendente
        registros.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        const frentes = (data.frentes || []).map((f: any) => ({
          name: f['Frentes de trabajo'] || f.name,
          coords: f.Coords || f.coords,
          radio: parseFloat(f.Radio || f.radio) || 100
        }));

        const cargos = (data.cargos || []).map((c: any) => ({
          name: c.Cargo || c.cargo || c.name,
          role: (c.Rol_App || c.rol || c.role || "Empleado") as Role
        }));

        const permisos = (data.permisos || []).map((p: any) => {
          const roles = [];
          if (p.Administrador === true || p.Administrador === "TRUE") roles.push('Administrador');
          if (p.Editor === true || p.Editor === "TRUE") roles.push('Editor');
          if (p.Aprobador === true || p.Aprobador === "TRUE") roles.push('Aprobador');
          if (p.Empleado === true || p.Empleado === "TRUE") roles.push('Empleado');
          return { label: p.Modulo, roles };
        });

        return { registros, usuarios, cargos, frentes, permisos };
      }
      throw new Error(data.message || "Error al obtener datos");
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<User> {
    if (!this.isConfigured()) throw new Error("API not configured");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "login", email, password }),
      });
      const data = await response.json();
      if (data.status === "success") {
        return {
          id: data.user.id || data.user.Email_Usuario,
          name: data.user.name || data.user.Nombre_Apellido,
          email: data.user.email || data.user.Email_Usuario,
          role: (data.user.role || data.user.Rol_App || "Empleado") as Role,
          avatar: data.user.avatar || "avatar-1",
        } as User;
      }
      throw new Error(data.message || "Error de inicio de sesión");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async register(params: { name: string; identificacion: string; telefono: string; cargo: string; email: string; password: string; avatarUrl?: string; huella?: string }): Promise<User> {
    if (!this.isConfigured()) throw new Error("API not configured");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "register", ...params }),
      });
      const data = await response.json();
      if (data.status === "success") {
        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role as Role,
          avatar: data.user.avatar,
          huella: data.user.huella
        };
      }
      throw new Error(data.message || "Error en el registro");
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  async checkInOut(params: { userId: string; userName: string; typeAction: CheckInType; latitude: number; longitude: number; signatureBase64: string; userAvatar: string; employeeComments?: string; huellaStatus?: string }): Promise<CheckInRecord> {
    if (!this.isConfigured()) throw new Error("API not configured");
    try {
      const localNow = new Date();
      // Format as HH:mm and YYYY-MM-DD
      const clientTime = localNow.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
      const year = localNow.getFullYear();
      const month = String(localNow.getMonth() + 1).padStart(2, '0');
      const day = String(localNow.getDate()).padStart(2, '0');
      const clientDate = `${year}-${month}-${day}`;

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "check_in_out", ...params, clientTime, clientDate }),
      });
      const data = await response.json();
      if (data.status === "success") {
        return {
          id: data.record.id,
          userId: data.record.userId,
          userName: data.record.userName,
          timestamp: new Date(data.record.timestamp),
          timestampEntrada: params.typeAction === 'Entrada' ? new Date(data.record.timestamp) : undefined,
          timestampSalida: params.typeAction === 'Salida' ? new Date(data.record.timestamp) : undefined,
          location: {
            latitude: data.record.latitude,
            longitude: data.record.longitude
          },
          distanceFromPost: data.record.distanceFromPost,
          signatureUrlEntrada: params.typeAction === 'Entrada' ? data.record.signatureUrl : "",
          signatureUrlSalida: params.typeAction === 'Salida' ? data.record.signatureUrl : "",
          status: data.record.status as CheckInStatus,
          userAvatar: data.record.userAvatar,
          employeeComments: data.record.employeeComments || "",
          huellaEntrada: params.typeAction === 'Entrada' ? data.record.huellaStatus : "",
          huellaSalida: params.typeAction === 'Salida' ? data.record.huellaStatus : ""
        };
      }
      throw new Error(data.message || "Error al registrar asistencia");
    } catch (error) {
      console.error("Check-in/out error:", error);
      throw error;
    }
  },

  async updateEmployeeComment(recordId: string, employeeComments: string, checkInTime?: string, checkOutTime?: string): Promise<void> {
    if (!this.isConfigured()) throw new Error("API not configured");
    try {
      const realId = recordId;
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ 
          type: "update_employee_comment", 
          recordId: realId, 
          employeeComments,
          checkInTime,
          checkOutTime
        }),
      });
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Error al actualizar registro");
      }
    } catch (error) {
      console.error("Update employee comment error:", error);
      throw error;
    }
  },

  async validateRecord(params: { recordId: string; status: CheckInStatus; comments?: string; approvedBy: string }): Promise<void> {
    if (!this.isConfigured()) throw new Error("API not configured");
    try {
      const realId = params.recordId;
      const payload = { type: "validate_record", ...params, recordId: realId };
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Error al validar el registro");
      }
    } catch (error) {
      console.error("Validation error:", error);
      throw error;
    }
  },

  async updateProfile(params: { userId: string; name: string; telefono: string; password?: string; avatarUrl?: string; huella?: string }): Promise<void> {
    if (!this.isConfigured()) throw new Error("API not configured");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "update_profile", ...params }),
      });
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Error al actualizar perfil");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  async updateUsers(updatedUsers: { id: string; cargo: string; role: Role; estado: string }[]): Promise<void> {
    if (!this.isConfigured()) {
      console.warn("API_URL de Google Sheets no configurada. Actualizando en memoria local.");
      const usuarios = getLocalStorageData<User[]>(STORAGE_KEYS.USERS, mockUsers);
      const updated = usuarios.map(u => {
        const update = updatedUsers.find(uu => uu.id === u.email || uu.id === u.id);
        return update ? { ...u, ...update } : u;
      });
      saveLocalStorageData(STORAGE_KEYS.USERS, updated);
      return;
    }
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "update_users", usuarios: updatedUsers })
      });
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Error al actualizar usuarios");
      }
    } catch (error) {
      console.error("Update users error:", error);
      throw error;
    }
  },

  async updateCargos(cargos: { name: string; role: Role }[]): Promise<void> {
    if (!this.isConfigured()) throw new Error("API not configured");
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ type: "update_cargos", cargos })
    });
    const data = await response.json();
    if (data.status !== "success") throw new Error(data.message || "Error al actualizar cargos");
  },

  async updateFrentes(frentes: { name: string; coords: string; radio: number }[]): Promise<void> {
    if (!this.isConfigured()) throw new Error("API not configured");
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ type: "update_frentes", frentes })
    });
    const data = await response.json();
    if (data.status !== "success") throw new Error(data.message || "Error al actualizar frentes");
  },

  async updatePermisos(permisos: { label: string; roles: string[] }[]): Promise<void> {
    if (!this.isConfigured()) throw new Error("API not configured");
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "update_permisos", permisos }),
      });
      const data = await response.json();
      if (data.status !== "success") throw new Error(data.message || "Error al actualizar permisos");
    } catch (error) {
      console.error("Update permisos error:", error);
      throw error;
    }
  }
};
