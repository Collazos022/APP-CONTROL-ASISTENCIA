"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { CheckInRecord } from "@/lib/types"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { placeholderImages } from "@/lib/placeholder-images"

export const columns: ColumnDef<CheckInRecord>[] = [
  {
    accessorKey: "userName",
    header: "Empleado",
    cell: ({ row }) => {
        const record = row.original;
        const avatar = placeholderImages.find(p => p.id === record.userAvatar);
        return (
            <div className="flex items-center gap-2">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src={avatar?.imageUrl} alt="Avatar" data-ai-hint={avatar?.imageHint} />
                  <AvatarFallback>{record.userName.substring(0,2)}</AvatarFallback>
                </Avatar>
                <span>{record.userName}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "type",
    header: "Tipo",
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha y Hora
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"))
      const formatted = date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "distanceFromPost",
    header: "Distancia (m)",
    cell: ({row}) => {
        const distance = row.original.distanceFromPost;
        if (distance === null) return <span className="text-muted-foreground">N/A</span>
        return <span>{distance}m</span>
    }
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
            className={cn({
                "bg-yellow-500 text-white": status === "Pendiente",
                "bg-green-600 text-white": status === "Aprobado",
                "bg-red-600 text-white": status === "Rechazado",
            })}
        >{status}</Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const record = row.original
      const [userRole, setUserRole] = React.useState<string | null>(null);

      React.useEffect(() => {
        if (typeof window !== "undefined") {
          setUserRole(localStorage.getItem("userRole"));
        }
      }, []);

      const handleApprove = async () => {
        try {
          const approvedBy = localStorage.getItem("userName") || "Supervisor";
          await api.validateRecord({
            recordId: record.id,
            status: "Aprobado",
            approvedBy
          });
          window.dispatchEvent(new CustomEvent("refresh-records"));
        } catch (error: any) {
          console.error("Error approving record:", error);
        }
      };

      const handleReject = async () => {
        const comment = prompt("Por favor, ingrese el motivo del rechazo:");
        if (comment === null) return; // cancelado
        
        try {
          const approvedBy = localStorage.getItem("userName") || "Supervisor";
          await api.validateRecord({
            recordId: record.id,
            status: "Rechazado",
            comments: comment,
            approvedBy
          });
          window.dispatchEvent(new CustomEvent("refresh-records"));
        } catch (error: any) {
          console.error("Error rejecting record:", error);
        }
      };

      // Si es empleado, no mostrar las opciones de validación
      const showValidationActions = userRole && userRole !== "Empleado";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(record.id)}
            >
              Copiar ID de Registro
            </DropdownMenuItem>
            {showValidationActions && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleApprove}>
                  Aprobar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleReject}>
                  Rechazar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
