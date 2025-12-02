
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { placeholderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

const users = [
    { name: "Carlos Ramirez", email: "carlos@example.com", role: "Empleado", avatar: "avatar-1"},
    { name: "Ana Garcia", email: "ana@example.com", role: "Empleado", avatar: "avatar-2"},
    { name: "Luis Fernandez", email: "luis@example.com", role: "Empleado", avatar: "avatar-3"},
    { name: "Maria Rodriguez", email: "maria@example.com", role: "Administrador", avatar: "avatar-2"},
    { name: "Jorge Perez", email: "jorge@example.com", role: "Aprobador", avatar: "avatar-1"},
];


export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios</CardTitle>
        <CardDescription>Lista de todos los usuarios registrados en el sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const avatar = placeholderImages.find(p => p.id === user.avatar);
              return (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={avatar?.imageUrl} data-ai-hint={avatar?.imageHint} />
                            <AvatarFallback>{user.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Administrador' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
