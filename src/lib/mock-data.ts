import { CheckInRecord, User, Role, CheckInStatus } from './types';

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
    timestamp: createRandomDate(1),
    timestampEntrada: createRandomDate(1),
    timestampSalida: new Date(createRandomDate(1).getTime() + 8 * 3600 * 1000),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 50,
    signatureUrlEntrada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    signatureUrlSalida: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    status: 'Aprobado',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-1',
    huellaEntrada: 'CORRECTA',
    huellaSalida: 'CORRECTA',
    frenteTrabajo: 'Frente A'
  },
  {
    id: 'rec-2',
    userId: 'user-2',
    userName: 'Ana Garcia',
    timestamp: createRandomDate(1),
    timestampEntrada: createRandomDate(1),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 120,
    signatureUrlEntrada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    status: 'Pendiente',
    userAvatar: 'avatar-2',
    huellaEntrada: 'CORRECTA',
    frenteTrabajo: 'Frente B'
  },
  {
    id: 'rec-3',
    userId: 'user-3',
    userName: 'Luis Fernandez',
    timestamp: createRandomDate(2),
    timestampEntrada: createRandomDate(2),
    timestampSalida: new Date(createRandomDate(2).getTime() + 9 * 3600 * 1000),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 25,
    signatureUrlEntrada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    signatureUrlSalida: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    status: 'Aprobado',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-3',
    huellaEntrada: 'SIN_HUELLA',
    huellaSalida: 'SIN_HUELLA',
    frenteTrabajo: 'Frente A'
  },
  {
    id: 'rec-4',
    userId: 'user-1',
    userName: 'Carlos Ramirez',
    timestamp: createRandomDate(1),
    timestampEntrada: createRandomDate(1),
    timestampSalida: new Date(createRandomDate(1).getTime() + 7 * 3600 * 1000),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 55,
    signatureUrlEntrada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    signatureUrlSalida: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    status: 'Aprobado',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-1',
    huellaEntrada: 'CORRECTA',
    huellaSalida: 'DISCREPANCIA',
    frenteTrabajo: 'Frente B'
  },
  {
    id: 'rec-5',
    userId: 'user-2',
    userName: 'Ana Garcia',
    timestamp: createRandomDate(1),
    timestampEntrada: createRandomDate(1),
    timestampSalida: new Date(createRandomDate(1).getTime() + 8 * 3600 * 1000),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 1500,
    signatureUrlEntrada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    signatureUrlSalida: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    status: 'Rechazado',
    comments: 'Fuera de la geocerca permitida.',
    approvedBy: 'Maria Rodriguez',
    userAvatar: 'avatar-2',
    huellaEntrada: 'SIN_HUELLA',
    huellaSalida: 'SIN_HUELLA',
    frenteTrabajo: 'Frente A'
  },
  {
    id: 'rec-6',
    userId: 'user-3',
    userName: 'Luis Fernandez',
    timestamp: createRandomDate(0),
    timestampEntrada: createRandomDate(0),
    location: { latitude: 19.4326, longitude: -99.1332 },
    distanceFromPost: 15,
    signatureUrlEntrada: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10,15 C 30,10 50,20 90,15" fill="none" stroke="black"/></svg>',
    status: 'Pendiente',
    userAvatar: 'avatar-3',
    huellaEntrada: 'CORRECTA',
    frenteTrabajo: 'Frente B'
  },
];
