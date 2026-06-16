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
  huella?: string;
  huellaRegistrada?: string;
  estado?: string;
}

export type CheckInStatus = "Pendiente" | "Aprobado" | "Rechazado";
export type CheckInType = "Entrada" | "Salida";

export interface CheckInRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date; // Usamos esto para ordenamiento (generalmente será la de Entrada)
  timestampEntrada?: Date;
  timestampSalida?: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceFromPost: number | null;
  signatureUrlEntrada?: string;
  signatureUrlSalida?: string;
  status: CheckInStatus;
  comments?: string; // Comentarios del supervisor
  employeeComments?: string; // Comentarios del empleado
  approvedBy?: string;
  userAvatar: string;
  hoursWorked?: number;
  hoursExtra?: number;
  huellaEntrada?: string;
  huellaSalida?: string;
  frenteTrabajo?: string;
}
