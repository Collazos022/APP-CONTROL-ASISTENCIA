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
  { id: 'user-1', name: 'Carlos Ramirez', email: 'carlos@example.com', role: 'Empleado' as Role, avatar: 'avatar-1' },
  { id: 'user-2', name: 'Ana Garcia', email: 'ana@example.com', role: 'Empleado' as Role, avatar: 'avatar-2' },
  { id: 'user-3', name: 'Luis Fernandez', email: 'luis@example.com', role: 'Empleado' as Role, avatar: 'avatar-3' },
  { id: 'user-4', name: 'Maria Rodriguez', email: 'maria@example.com', role: 'Administrador' as Role, avatar: 'avatar-2' },
  { id: 'user-5', name: 'Jorge Perez', email: 'jorge@example.com', role: 'Aprobador' as Role, avatar: 'avatar-1' },
];

const mockCargos = [
  { name: 'Gerente', role: 'Administrador' as Role },
  { name: 'Coordinador', role: 'Aprobador' as Role },
  { name: 'RRHH', role: 'Editor' as Role },
  { name: 'Supervisor Op', role: 'Aprobador' as Role },
  { name: 'Supervisor HSE', role: 'Aprobador' as Role },
  { name: 'Ingeniero Op', role: 'Empleado' as Role },
  { name: 'Soldador API', role: 'Empleado' as Role },
  { name: 'Tubero 1', role: 'Empleado' as Role },
  { name: 'Auxiliar Soldadura', role: 'Empleado' as Role },
  { name: 'Obrero', role: 'Empleado' as Role },
];

const mockFrentes = [
  { name: 'Frente A', coords: '4.60971, -74.08175', radio: 100 },
  { name: 'Frente B', coords: '3.451647, -76.531982', radio: 100 },
  { name: 'Taller', coords: '6.244203, -75.581215', radio: 150 },
  { name: 'Oficina', coords: '4.624335, -74.063644', radio: 50 },
];

export interface AppData {
  registros: CheckInRecord[];
  usuarios: User[];
  cargos: { name: string; role: Role }[];
  frentes: { name: string; coords: string; radio: number }[];
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
      
      return { registros: records, usuarios, cargos, frentes };
    }

    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.status === "success") {
        const registros = (data.registros || []).map((r: any) => ({
          id: r.id,
          userId: r.userId,
          userName: r.userName,
          type: r.type as CheckInType,
          timestamp: new Date(r.timestamp),
          location: {
            latitude: parseFloat(r.latitude) || 0,
            longitude: parseFloat(r.longitude) || 0
          },
          distanceFromPost: r.distanceFromPost !== null ? parseInt(r.distanceFromPost) : null,
          signatureUrl: r.signatureUrl || "",
          status: r.status as CheckInStatus,
          comments: r.comments || "",
          approvedBy: r.approvedBy || "",
          userAvatar: r.userAvatar || "avatar-1",
          employeeComments: r.employeeComments || ""
        }));
        
        const usuarios = (data.usuarios || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.rol as Role,
          avatar: u.avatar || "avatar-1",
          identificacion: u.identificacion || "",
          telefono: u.telefono || "",
          cargo: u.cargo || ""
        }));

        const frentes = (data.frentes || []).map((f: any) => ({
          name: f.frente,
          coords: f.coords,
          radio: parseInt(f.radio) || 100
        }));

        const cargos = (data.cargos || []).map((c: any) => ({
          name: c.cargo || c.name,
          role: (c.rol || c.role) as Role
        }));

        return { registros, usuarios, cargos, frentes };
      }
      throw new Error(data.message || "Error al obtener datos");
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<User> {
    if (!this.isConfigured()) {
      const usuarios = getLocalStorageData<any[]>(STORAGE_KEYS.USERS, mockUsers);
      const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        return user;
      }
      throw new Error("Usuario no encontrado en la simulación.");
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "login", email, password }),
      });
      const data = await response.json();
      if (data.status === "success") {
        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.rol as Role,
          avatar: data.user.avatar || "avatar-1",
          identificacion: data.user.identificacion || "",
          telefono: data.user.telefono || "",
          cargo: data.user.cargo || ""
        } as any;
      }
      throw new Error(data.message || "Error de inicio de sesión");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async register(params: { name: string; identificacion: string; telefono: string; cargo: string; email: string; password: string; avatarUrl?: string }): Promise<User> {
    if (!this.isConfigured()) {
      const usuarios = getLocalStorageData<any[]>(STORAGE_KEYS.USERS, mockUsers);
      if (usuarios.some(u => u.email.toLowerCase() === params.email.toLowerCase())) {
        throw new Error("El correo electrónico ya está registrado.");
      }
      
      const cargos = getLocalStorageData<{ name: string; role: Role }[]>(STORAGE_KEYS.CARGOS, mockCargos);
      const cargoRole = cargos.find(c => c.name.toLowerCase() === params.cargo.toLowerCase())?.role || "Empleado";

      const newUser: User = {
        id: "usr-" + Math.random().toString(36).substr(2, 9),
        name: params.name,
        email: params.email,
        role: cargoRole,
        avatar: params.avatarUrl || "avatar-" + (Math.floor(Math.random() * 3) + 1),
      };
      
      usuarios.push({ ...newUser, password: params.password, identificacion: params.identificacion, telefono: params.telefono, cargo: params.cargo });
      saveLocalStorageData(STORAGE_KEYS.USERS, usuarios);
      return newUser;
    }

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
          avatar: data.user.avatar
        };
      }
      throw new Error(data.message || "Error en el registro");
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  async checkInOut(params: { userId: string; userName: string; typeAction: CheckInType; latitude: number; longitude: number; signatureBase64: string; userAvatar: string; employeeComments?: string }): Promise<CheckInRecord> {
    if (!this.isConfigured()) {
      const records = getLocalStorageData<any[]>(STORAGE_KEYS.RECORDS, MOCK_RECORDS);
      const frentes = getLocalStorageData<any[]>(STORAGE_KEYS.FRENTES, mockFrentes);
      
      let minDistance = null;
      frentes.forEach(frente => {
        const parts = frente.coords.split(",");
        const fLat = parseFloat(parts[0]);
        const fLon = parseFloat(parts[1]);
        if (!isNaN(fLat) && !isNaN(fLon)) {
          const R = 6371000;
          const dLat = (fLat - params.latitude) * Math.PI / 180;
          const dLon = (fLon - params.longitude) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(params.latitude * Math.PI / 180) * Math.cos(fLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;
          if (minDistance === null || dist < minDistance) {
            minDistance = Math.round(dist);
          }
        }
      });

      const newRecord: CheckInRecord = {
        id: "rec-" + Math.random().toString(36).substr(2, 9),
        userId: params.userId,
        userName: params.userName,
        type: params.typeAction,
        timestamp: new Date(),
        location: { latitude: params.latitude, longitude: params.longitude },
        distanceFromPost: minDistance,
        signatureUrl: params.signatureBase64, // local storage stores the base64 string
        status: "Pendiente",
        userAvatar: params.userAvatar,
        employeeComments: params.employeeComments || ""
      };

      records.unshift(newRecord);
      saveLocalStorageData(STORAGE_KEYS.RECORDS, records);
      return newRecord;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "check_in_out", ...params }),
      });
      const data = await response.json();
      if (data.status === "success") {
        return {
          id: data.record.id,
          userId: data.record.userId,
          userName: data.record.userName,
          type: data.record.type as CheckInType,
          timestamp: new Date(data.record.timestamp),
          location: {
            latitude: data.record.latitude,
            longitude: data.record.longitude
          },
          distanceFromPost: data.record.distanceFromPost,
          signatureUrl: data.record.signatureUrl,
          status: data.record.status as CheckInStatus,
          userAvatar: data.record.userAvatar,
          employeeComments: data.record.employeeComments || ""
        };
      }
      throw new Error(data.message || "Error al registrar asistencia");
    } catch (error) {
      console.error("Check-in/out error:", error);
      throw error;
    }
  },

  async updateEmployeeComment(recordId: string, employeeComments: string): Promise<void> {
    if (!this.isConfigured()) {
      const records = getLocalStorageData<any[]>(STORAGE_KEYS.RECORDS, MOCK_RECORDS);
      const idx = records.findIndex(r => r.id === recordId);
      if (idx !== -1) {
        records[idx].employeeComments = employeeComments;
        // Si estaba rechazado, devolver el estado a "Pendiente"
        if (records[idx].status === "Rechazado") {
          records[idx].status = "Pendiente";
        }
        saveLocalStorageData(STORAGE_KEYS.RECORDS, records);
        return;
      }
      throw new Error("Registro no encontrado");
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "update_employee_comment", recordId, employeeComments }),
      });
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Error al actualizar comentario del empleado");
      }
    } catch (error) {
      console.error("Update employee comment error:", error);
      throw error;
    }
  },

  async validateRecord(params: { recordId: string; status: CheckInStatus; comments?: string; approvedBy: string }): Promise<void> {
    if (!this.isConfigured()) {
      const records = getLocalStorageData<any[]>(STORAGE_KEYS.RECORDS, MOCK_RECORDS);
      const idx = records.findIndex(r => r.id === params.recordId);
      if (idx !== -1) {
        records[idx].status = params.status;
        records[idx].comments = params.comments || "";
        records[idx].approvedBy = params.approvedBy;
        saveLocalStorageData(STORAGE_KEYS.RECORDS, records);
        return;
      }
      throw new Error("Registro no encontrado");
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "validate_record", ...params }),
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

  async updateProfile(params: { userId: string; name: string; telefono: string; password?: string; avatarUrl?: string }): Promise<void> {
    if (!this.isConfigured()) {
      const users = getLocalStorageData<any[]>(STORAGE_KEYS.USERS, mockUsers);
      const idx = users.findIndex(u => u.id === params.userId);
      if (idx !== -1) {
        users[idx].name = params.name;
        users[idx].telefono = params.telefono;
        if (params.password) {
          users[idx].password = params.password;
        }
        if (params.avatarUrl) {
          users[idx].avatar = params.avatarUrl;
        }
        saveLocalStorageData(STORAGE_KEYS.USERS, users);
        return;
      }
      throw new Error("Usuario no encontrado");
    }

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

  async updateCargos(cargos: { name: string; role: Role }[]): Promise<void> {
    if (!this.isConfigured()) {
      saveLocalStorageData(STORAGE_KEYS.CARGOS, cargos);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "update_cargos", cargos }),
      });
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Error al actualizar cargos");
      }
    } catch (error) {
      console.error("Update cargos error:", error);
      throw error;
    }
  },

  async updateFrentes(frentes: { name: string; coords: string; radio: number }[]): Promise<void> {
    if (!this.isConfigured()) {
      saveLocalStorageData(STORAGE_KEYS.FRENTES, frentes);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ type: "update_frentes", frentes }),
      });
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Error al actualizar frentes");
      }
    } catch (error) {
      console.error("Update frentes error:", error);
      throw error;
    }
  }
};
