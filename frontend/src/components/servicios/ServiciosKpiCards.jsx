import React from 'react';
import { Stethoscope, PlusCircle, Users2, TrendingUp, DollarSign, Building2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ServiciosKpiCards({ kpis, filters }) {
  const totalServicios = kpis?.totalServicios ?? 0;
  const costoTotal = kpis?.costoTotal ?? 0;
  const promedioMensual = kpis?.promedioMensual ?? 0;
  const establecimientos = kpis?.establecimientosConServicios ?? 12;
  const variacion = kpis?.variacionGestionAnterior ?? null;

  const tipoLabel = filters.tipo !== 'all' ? filters.tipo : 'Todas';
  const grupoLabel = filters.grupoProc !== 'all' ? filters.grupoProc : 'Todas';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-5">
      {/* 1. Total de Servicios (Main Hero KPI as in screenshot) */}
      <div className="bg-gradient-to-br from-[#003844] to-[#014d5e] text-white rounded-2xl p-4 shadow-md border border-teal-600/40 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute right-2 -bottom-2 opacity-10 pointer-events-none">
          <Stethoscope className="w-24 h-24" />
        </div>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-sky-500/30 text-sky-200 border border-sky-400/30">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-200 block">
              Total de Servicios
            </span>
            <span className="text-[9px] text-teal-300/70">
              Gestión {filters.year}
            </span>
          </div>
        </div>

        <div>
          <div className="text-2xl lg:text-3xl font-black tracking-tight text-white tabular-nums">
            {formatNumber(totalServicios)}
          </div>
          {variacion !== null && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full w-fit border border-emerald-400/30">
              {variacion >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-300" />
              )}
              <span>{Math.abs(variacion)}% vs. gestión anterior</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Tipo de Servicio (As in screenshot) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tipo de Servicio
            </span>
            <span className="text-[9px] text-slate-400">Filtro aplicado</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white truncate" title={tipoLabel}>
            {tipoLabel}
          </h3>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block mt-0.5">
            {filters.tipo !== 'all' ? 'Filtrado' : 'Consolidado general'}
          </span>
        </div>
      </div>

      {/* 3. Grupo Procedimiento (As in screenshot) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Grupo Procedimiento
            </span>
            <span className="text-[9px] text-slate-400">Categoría clínica</span>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white truncate" title={grupoLabel}>
            {grupoLabel}
          </h3>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
            {filters.grupoProc !== 'all' ? 'Filtrado' : 'Consolidado general'}
          </span>
        </div>
      </div>

      {/* 4. Promedio Mensual */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Promedio Mensual
            </span>
            <span className="text-[9px] text-slate-400">Ritmo de atención</span>
          </div>
        </div>
        <div>
          <div className="text-lg font-black text-slate-800 dark:text-white tabular-nums">
            {formatNumber(promedioMensual)}
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block mt-0.5">
            servicios/mes
          </span>
        </div>
      </div>

      {/* 5. Costo Total Servicios */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Costo Total
            </span>
            <span className="text-[9px] text-slate-400">Valorización monetaria</span>
          </div>
        </div>
        <div>
          <div className="text-base font-black text-slate-800 dark:text-white truncate" title={formatCurrency(costoTotal)}>
            {formatCurrency(costoTotal)}
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
            Presupuesto ejecutado
          </span>
        </div>
      </div>

      {/* 6. Establecimientos con Servicios */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Red de Salud
            </span>
            <span className="text-[9px] text-slate-400">Montero</span>
          </div>
        </div>
        <div>
          <div className="text-lg font-black text-slate-800 dark:text-white tabular-nums">
            {establecimientos}
          </div>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block mt-0.5">
            Establecimientos activos
          </span>
        </div>
      </div>
    </div>
  );
}
