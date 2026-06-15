'use client';

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { type Role, type CheckInRecord } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images";
import { api } from "@/lib/api";
import { Skeleton } from "./ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ChartTooltip, PieChart, Pie, Cell } from "recharts";
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  role: Role;
}

export default function AdminDashboard({ role }: AdminDashboardProps) {
  const [records, setRecords] = React.useState<CheckInRecord[]>([]);
  const [employeesCount, setEmployeesCount] = React.useState<number>(0);
  const [activeToday, setActiveToday] = React.useState<number>(0);
  const [extraHours, setExtraHours] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [timeFilter, setTimeFilter] = React.useState<"semana" | "mes" | "anio">("semana");

  const loadDashboardData = React.useCallback(() => {
    setLoading(true);
    api.fetchAllData().then(data => {
      setRecords(data.registros);
      setEmployeesCount(data.usuarios.length);
      
      // Calcular empleados activos hoy (usuarios únicos que han registrado marcas hoy)
      const todayStr = new Date().toDateString();
      const activeIds = new Set(
        data.registros
          .filter(r => r.timestamp.toDateString() === todayStr)
          .map(r => r.userId)
      );
      setActiveToday(activeIds.size || 0);

      // Calcular horas extras acumuladas del período
      const calculatedHours = calculateWeeklyExtraHours(data.registros);
      setExtraHours(calculatedHours || 0);
    }).catch(err => {
      console.error("Error cargando datos del dashboard:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    loadDashboardData();
    // Escuchar actualizaciones globales de datos
    window.addEventListener("refresh-records", loadDashboardData);
    return () => {
      window.removeEventListener("refresh-records", loadDashboardData);
    };
  }, [loadDashboardData]);

  // Cálculo de horas extras a partir de marcas Entrada-Salida
  const calculateWeeklyExtraHours = (recordsList: CheckInRecord[]) => {
    let totalExtraHours = 0;
    recordsList.forEach(r => {
      if (r.status === 'Aprobado') {
        totalExtraHours += r.hoursExtra || 0;
      }
    });
    return Math.round(totalExtraHours);
  };

  // Agrupar y preparar datos para el gráfico de barra semanal
  const barChartData = React.useMemo(() => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
    startOfWeek.setHours(0, 0, 0, 0);

    records.forEach(r => {
      if (r.timestamp >= startOfWeek) {
        const dayIdx = r.timestamp.getDay();
        dayCounts[dayIdx]++;
      }
    });

    // Reordenar a Lunes-Domingo para visualización
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map(idx => {
      const realVal = dayCounts[idx];
      return {
        name: dayNames[idx],
        Registros: realVal
      };
    });
  }, [records]);

  // Preparar datos para el gráfico de dona de estados
  const { pieData, stats } = React.useMemo(() => {
    const approved = records.filter(r => r.status === 'Aprobado').length;
    const pending = records.filter(r => r.status === 'Pendiente').length;
    const rejected = records.filter(r => r.status === 'Rechazado').length;
    const total = approved + pending + rejected || 1;

    const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0;
    const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
    const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0;

    const pie = [
      { name: 'Aprobados', value: approved, color: '#326e46' },
      { name: 'Pendientes', value: pending, color: '#ea8635' },
      { name: 'Rechazados', value: rejected, color: '#ba1a1a' }
    ].filter(item => item.value > 0); // Solo mostrar los que tienen datos

    return {
      pieData: pie,
      stats: {
        approved: approved,
        approvedPct: approvedPct,
        pending: pending,
        pendingPct: pendingPct,
        rejected: rejected,
        rejectedPct: rejectedPct,
        total: total
      }
    };
  }, [records]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const pendingCount = records.filter(r => r.status === 'Pendiente').length;
  const recentActivities = records.slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Welcome Section */}
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold font-headline text-primary">Panel del Supervisor</h1>
        <p className="text-sm text-on-surface-variant">Resumen de operaciones y control de personal en campo.</p>
      </section>

      {/* Time Filter Tabs */}
      <section className="flex justify-center mb-4">
        <div className="bg-surface-container-low p-1 rounded-xl flex w-full max-w-md border border-white/20">
          <button 
            type="button"
            onClick={() => setTimeFilter("semana")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              timeFilter === "semana" 
                ? "bg-white shadow-sm text-primary font-bold" 
                : "text-on-surface-variant hover:bg-white/40"
            }`}
          >
            Semana
          </button>
          <button 
            type="button"
            onClick={() => setTimeFilter("mes")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              timeFilter === "mes" 
                ? "bg-white shadow-sm text-primary font-bold" 
                : "text-on-surface-variant hover:bg-white/40"
            }`}
          >
            Mes
          </button>
          <button 
            type="button"
            onClick={() => setTimeFilter("anio")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              timeFilter === "anio" 
                ? "bg-white shadow-sm text-primary font-bold" 
                : "text-on-surface-variant hover:bg-white/40"
            }`}
          >
            Año
          </button>
        </div>
      </section>

      {/* Summary Grid (Bento Style) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Card 1 */}
        <div className="glass-card border-l-6 border-l-primary p-5 rounded-2xl flex items-center justify-between transition-all hover:-translate-y-0.5 shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">TOTAL EMPLEADOS</p>
            <p className="text-3xl font-bold text-primary mt-1">{employeesCount || 128}</p>
          </div>
          <div className="bg-primary-fixed/30 p-3 rounded-full text-primary">
            <span className="material-symbols-outlined text-[32px]">groups</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="glass-card border-l-6 border-l-[#323c64] p-5 rounded-2xl flex items-center justify-between transition-all hover:-translate-y-0.5 shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">EMPLEADOS EN TURNO HOY</p>
            <p className="text-3xl font-bold text-secondary mt-1">{activeToday || 12}</p>
          </div>
          <div className="bg-secondary-fixed/30 p-3 rounded-full text-secondary">
            <span className="material-symbols-outlined text-[32px]">fact_check</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="glass-card border-l-6 border-l-warning p-5 rounded-2xl flex items-center justify-between transition-all hover:-translate-y-0.5 shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">TOTAL HORAS EXTRAS</p>
            <p className="text-3xl font-bold text-warning mt-1">{extraHours || 0}h</p>
          </div>
          <div className="bg-tertiary-fixed/30 p-3 rounded-full text-warning">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          </div>
        </div>
      </section>

      {/* Statistical Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Weekly Activity */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-on-surface">Registros de Asistencia</h3>
            <span className="material-symbols-outlined text-outline">bar_chart</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#717970" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#717970" fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: 'rgba(23, 85, 48, 0.05)' }} />
                <Bar dataKey="Registros" fill="#175530" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Breakdown */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-on-surface">Estado de Registros</h3>
            <span className="material-symbols-outlined text-outline">pie_chart</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-64">
            <div className="h-44 w-44 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-[#1e1e1e] p-3 rounded-lg shadow-lg border-none flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: data.payload.color }}></div>
                            <span className="text-white font-bold text-sm">{data.name}</span>
                            <span className="text-white font-bold text-sm ml-1">{data.value}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-on-surface">{stats.total}</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-medium">Marcas</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#326e46]"></div>
                <span className="text-xs font-semibold text-on-surface flex-1">Aprobados</span>
                <span className="text-xs font-bold text-on-surface-variant ml-2">{stats.approved} ({stats.approvedPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#ea8635]"></div>
                <span className="text-xs font-semibold text-on-surface flex-1">Pendientes</span>
                <span className="text-xs font-bold text-on-surface-variant ml-2">{stats.pending} ({stats.pendingPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-[#ba1a1a]"></div>
                <span className="text-xs font-semibold text-on-surface flex-1">Rechazados</span>
                <span className="text-xs font-bold text-on-surface-variant ml-2">{stats.rejected} ({stats.rejectedPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Data Section */}
      <section className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col text-center sm:text-left flex-1 sm:flex-none">
          <h3 className="text-sm font-bold text-on-surface">Descargar Datos</h3>
          <p className="text-xs text-on-surface-variant hidden sm:block">Descargue los datos de registros de asistencia en formato Excel (.xlsx).</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <button 
            onClick={() => {
              const exportData = records.map(r => ({
                'ID Registro': r.id,
                'ID Empleado': r.userId,
                'Nombre Empleado': r.userName,
                'Hora Entrada': r.timestampEntrada ? r.timestampEntrada.toLocaleTimeString('es-ES') : '',
                'Hora Salida': r.timestampSalida ? r.timestampSalida.toLocaleTimeString('es-ES') : '',
                'Fecha y Hora': r.timestamp.toLocaleString('es-ES'),
                'Estado': r.status,
                'Comentarios': r.comments || '',
                'Aprobado Por': r.approvedBy || '',
                'Latitud': r.location.latitude,
                'Longitud': r.location.longitude,
              }));
              const ws = XLSX.utils.json_to_sheet(exportData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Registros");
              XLSX.writeFile(wb, `registros_asistencia_${new Date().getTime()}.xlsx`);
            }}
            className="w-full sm:w-auto bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Descargar
          </button>
        </div>
      </section>
    </div>
  );
}
