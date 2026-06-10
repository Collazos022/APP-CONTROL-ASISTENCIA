export type Role = "Administrador" | "Editor" | "Aprobador" | "Empleado";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  identificacion?: string;
  telefono?: string;
  cargo?: string;
}

export type CheckInStatus = "Pendiente" | "Aprobado" | "Rechazado";
export type CheckInType = "Entrada" | "Salida";

export interface CheckInRecord {
  id: string;
  userId: string;
  userName: string;
  type: CheckInType;
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceFromPost: number | null;
  signatureUrl: string;
  status: CheckInStatus;
  comments?: string; // Comentarios del supervisor
  employeeComments?: string; // Comentarios del empleado
  approvedBy?: string;
  userAvatar: string;
}
