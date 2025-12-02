import { CheckInRecord, User, Role, CheckInStatus, CheckInType } from './types';

const USERS: User[] = [
  { id: 'user-1', name: 'Carlos Ramirez', email: 'carlos@example.com', role: 'Empleado', avatar: 'avatar-1' },
  { id: 'user-2', name: 'Ana Garcia', email: 'ana@example.com', role: 'Empleado', avatar: 'avatar-2' },
  { id: 'user-3', name: 'Luis Fernandez', email: 'luis@example.com', role: 'Empleado', avatar: 'avatar-3' },
  { id: 'user-4', name: 'Maria Rodriguez', email: 'maria@example.com', role: 'Administrador', avatar: 'avatar-2' },
];

function createRandomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 10) + 8); // 8 AM to 5 PM
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

export const MOCK_RECORDS: CheckInRecord[] = [
  {
    id: 'rec-1',
    userId: 'user-1',
    userName: 'Carlos Ramirez',
    type: 'Entrada',
    timestamp: createRandomDate(1),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 50,
    signatureUrl: '',
    status: 'Aprobado',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-1',
  },
  {
    id: 'rec-2',
    userId: 'user-2',
    userName: 'Ana Garcia',
    type: 'Entrada',
    timestamp: createRandomDate(1),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 120,
    signatureUrl: '',
    status: 'Pendiente',
    userAvatar: 'avatar-2',
  },
  {
    id: 'rec-3',
    userId: 'user-3',
    userName: 'Luis Fernandez',
    type: 'Salida',
    timestamp: createRandomDate(2),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 25,
    signatureUrl: '',
    status: 'Aprobado',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-3',
  },
    {
    id: 'rec-4',
    userId: 'user-1',
    userName: 'Carlos Ramirez',
    type: 'Salida',
    timestamp: createRandomDate(1),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 55,
    signatureUrl: '',
    status: 'Aprobado',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-1',
  },
  {
    id: 'rec-5',
    userId: 'user-2',
    userName: 'Ana Garcia',
    type: 'Salida',
    timestamp: createRandomDate(1),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 1500,
    signatureUrl: '',
    status: 'Rechazado',
    comments: 'Fuera de la geocerca permitida.',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-2',
  },
  {
    id: 'rec-6',
    userId: 'user-3',
    userName: 'Luis Fernandez',
    type: 'Entrada',
    timestamp: createRandomDate(0),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 15,
    signatureUrl: '',
    status: 'Pendiente',
    userAvatar: 'avatar-3',
  },
];
