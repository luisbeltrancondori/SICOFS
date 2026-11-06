import React from 'react';
import { 
  Pill, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Award, 
  FileText, 
  Boxes, 
  Sparkles,
  Info
} from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MedicamentosKpiCards({ kpis, filters }) {
  const totalCantidad = kpis?.totalCantidad ?? 0;
  const totalCosto = kpis?.totalCosto ?? 0;
  const medicamentosDiferentes = kpis?.medicamentosDiferentes ?? 0;
  const recetasDistintas = kpis?.recetasDistintas ?? 0;
  const promedioMensualGasto = kpis?.promedioMensualGasto ?? 0;
  const comp = kpis?.comparacionGestionAnterior;

  const topDispensado = kpis?.topDispensado;
  const topGasto = kpis?.topGasto;
  const topRecetado = kpis?.topRecetado;

  return (
    <div className="space-y-3.5 mb-5">
      {/* Primary KPI Grid (6 Executive KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">

        {/* 1. Cantidad Total de Medicamentos */}
        <div className="bg-gradient-to-br from-[#003844] to-[#014d5e] text-white rounded-2xl p-4 shadow-md border border-teal-600/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-2 -bottom-2 opacity-10 pointer-events-none">
            <Pill className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-sky-500/30 text-sky-200 border border-sky-400/30">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-200 block">
                Cantidad Total
              </span>
              <span className="text-[9px] text-teal-300/70">
                Unidades dispensadas
              </span>
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black tracking-tight text-white tabular-nums">
              {formatNumber(totalCantidad)}
            </div>
            {comp && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full w-fit border border-emerald-400/30">
                {comp.pctCant >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3 text-rose-300" />}
                <span>{Math.abs(comp.pctCant)}% vs. {comp.prevYear}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Medicamentos Diferentes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Catálogo Activo
              </span>
              <span className="text-[9px] text-slate-400">Productos distintos</span>
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tabular-nums">
              {formatNumber(medicamentosDiferentes)}
            </div>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block mt-0.5">
              códigos con movimiento
            </span>
          </div>
        </div>

        {/* 3. Costo Total de Medicamentos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Costo Total
              </span>
              <span className="text-[9px] text-slate-400">Presupuesto ejecutado</span>
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-slate-800 dark:text-white truncate" title={formatCurrency(totalCosto)}>
              {formatCurrency(totalCosto)}
            </div>
            {comp && (
              <span className={`text-[10px] font-semibold block mt-0.5 ${comp.pctCosto >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {comp.pctCosto >= 0 ? `+${comp.pctCosto}%` : `${comp.pctCosto}%`} vs {comp.prevYear}
              </span>
            )}
          </div>
        </div>

        {/* 4. Medicamento Más Dispensado */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Mayor Volumen
              </span>
              <span className="text-[9px] text-slate-400">Más dispensado</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={topDispensado?.nombre}>
              {topDispensado?.nombre || '—'}
            </h4>
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <span className="font-extrabold text-teal-600 dark:text-teal-400">
                {formatNumber(topDispensado?.cantidad)} unid.
              </span>
              <span className="text-slate-400">{topDispensado?.concentracion}</span>
            </div>
          </div>
        </div>

        {/* 5. Medicamento de Mayor Gasto */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Mayor Gasto
              </span>
              <span className="text-[9px] text-slate-400">Impacto monetario</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate" title={topGasto?.nombre}>
              {topGasto?.nombre || '—'}
            </h4>
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <span className="font-extrabold text-purple-600 dark:text-purple-400">
                {formatCurrency(topGasto?.costo)}
              </span>
              <span className="text-slate-400">{formatNumber(topGasto?.cantidad)} unid.</span>
            </div>
          </div>
        </div>

        {/* 6. Promedio Mensual de Gasto */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Promedio Mensual
              </span>
              <span className="text-[9px] text-slate-400">Ritmo de gasto</span>
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-slate-800 dark:text-white truncate" title={formatCurrency(promedioMensualGasto)}>
              {formatCurrency(promedioMensualGasto)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              ejecución mensual promedio
            </span>
          </div>
        </div>

      </div>

      {/* KPI Especial: "¿Qué medicamento se receta más?" (Distinción rigurosa de Recetas vs Unidades vs Costo) */}
      <div className="bg-gradient-to-r from-sky-50 via-teal-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 rounded-2xl p-4 border border-sky-200/70 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-sm shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300">
                KPI Especial: ¿Qué medicamento se receta más?
              </span>
              <span className="text-[10px] bg-sky-200/60 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 px-2 py-0.2 rounded-full font-bold">
                Recetas Únicas (Id_Salida)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Medicamento con mayor frecuencia de recetas para los filtros activos: <strong>{topRecetado?.nombre || '—'}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Recetas Distintas
            </span>
            <span className="text-sm font-black text-sky-700 dark:text-sky-300 tabular-nums">
              {formatNumber(topRecetado?.recetas)} recetas
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total Dispensado
            </span>
            <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">
              {formatNumber(topRecetado?.cantidad)} unid.
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Gasto Acumulado
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(topRecetado?.costo)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
