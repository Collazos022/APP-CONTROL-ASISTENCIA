
import { RecordsDataTable } from "@/components/records-data-table";
import { columns } from "./columns";
import { MOCK_RECORDS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RecordsPage() {
  // En una app real, filtrarías por el ID del usuario logueado
  const loggedInUserId = 'user-1'; 
  const userRecords = MOCK_RECORDS.filter(r => r.userId === loggedInUserId);

  return (
    <Tabs defaultValue="all">
      <h1 className="text-2xl font-bold font-headline mb-4">Mis Registros</h1>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobados</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="all">
        <RecordsDataTable columns={columns} data={userRecords} />
      </TabsContent>
      <TabsContent value="pending">
        <RecordsDataTable columns={columns} data={userRecords.filter(r => r.status === 'Pendiente')} />
      </TabsContent>
      <TabsContent value="approved">
        <RecordsDataTable columns={columns} data={userRecords.filter(r => r.status === 'Aprobado')} />
      </TabsContent>
      <TabsContent value="rejected">
        <RecordsDataTable columns={columns} data={userRecords.filter(r => r.status === 'Rechazado')} />
      </TabsContent>
    </Tabs>
  );
}
