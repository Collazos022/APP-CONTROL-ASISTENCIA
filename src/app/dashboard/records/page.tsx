import { RecordsDataTable } from "@/components/records-data-table";
import { columns } from "./columns";
import { MOCK_RECORDS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RecordsPage() {
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobados</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="all">
        <RecordsDataTable columns={columns} data={MOCK_RECORDS} />
      </TabsContent>
      <TabsContent value="pending">
        <RecordsDataTable columns={columns} data={MOCK_RECORDS.filter(r => r.status === 'Pendiente')} />
      </TabsContent>
      <TabsContent value="approved">
        <RecordsDataTable columns={columns} data={MOCK_RECORDS.filter(r => r.status === 'Aprobado')} />
      </TabsContent>
    </Tabs>
  );
}
