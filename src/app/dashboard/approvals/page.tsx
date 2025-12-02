
'use client'
import { RecordsDataTable } from "@/components/records-data-table";
import { columns } from "../records/columns";
import { MOCK_RECORDS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as React from "react";

const frentes = ["Todos", "Frente A", "Frente B", "Taller", "Oficina"];

export default function RecordsPage() {
  const [frente, setFrente] = React.useState("Todos");
  // En una app real, los datos se filtrarían por frente en el backend
  const filteredData = MOCK_RECORDS; 

  return (
    <div className="space-y-4">
        <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold font-headline">Aprobaciones</h1>
            <Select value={frente} onValueChange={setFrente}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por frente" />
                </SelectTrigger>
                <SelectContent>
                    {frentes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        <Tabs defaultValue="pending">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="pending">Pendientes</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="approved">Aprobados</TabsTrigger>
              <TabsTrigger value="rejected">Rechazados</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all">
            <RecordsDataTable columns={columns} data={filteredData} />
          </TabsContent>
          <TabsContent value="pending">
            <RecordsDataTable columns={columns} data={filteredData.filter(r => r.status === 'Pendiente')} />
          </TabsContent>
          <TabsContent value="approved">
            <RecordsDataTable columns={columns} data={filteredData.filter(r => r.status === 'Aprobado')} />
          </TabsContent>
          <TabsContent value="rejected">
            <RecordsDataTable columns={columns} data={filteredData.filter(r => r.status === 'Rechazado')} />
          </TabsContent>
        </Tabs>
    </div>
  );
}
