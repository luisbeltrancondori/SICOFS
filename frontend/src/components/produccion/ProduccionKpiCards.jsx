import React from 'react';
import {
  DollarSign, TrendingUp, Calendar, Building2, ClipboardList, ArrowUpDown,
  TrendingDown, Minus, AlertCircle
} from 'lucide-react';

function fmt(n) {
  if (n == null || isNaN(n)) return '0,00';
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtInt(n) {
  if (n == null || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('es-BO');
}

function KpiCard({ icon: Icon, color, title, value, subtitle, badge, badgeColor }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-shadow`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-[0.07] ${color}`} />
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${color} bg-opacity-15 text-white`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{title}</p>
        <p className="text-xl font-black text-slate-800 dark:text-white leading-tight">{value}</p>
        {subtitle && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function ProduccionKpiCards({ kpis, yoyData, filters }) {
  if (!kpis) return null;

  const {
    totalCosto, totalRegistros, estActivos,
    mesesConDatos, promMensual, mesMayor,
  } = kpis;

  // YoY card logic
  let yoyValue = '—';
  let yoySubtitle = 'Sin datos comparables';
  let YoyIcon = Minus;
  let yoyBadgeColor = 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300';
  let yoyBg = 'bg-slate-400';

  if (yoyData) {
    const pct = yoyData.porcentaje;
    const signo = pct >= 0 ? '+' : '';
    yoyValue = `${signo}${pct.toLocaleString('es-BO', { minimumFractionDigits: 1 })} %`;
    const diffAbs = Math.abs(yoyData.diferencia);
    yoySubtitle = `${pct >= 0 ? '▲' : '▼'} Bs. ${fmt(diffAbs)} vs. ${yoyData.prevYear}` +
      (yoyData.mesesComparados < 12 ? ` · ${yoyData.mesesComparados} meses comparados` : '');
    YoyIcon = pct >= 0 ? TrendingUp : TrendingDown;
    yoyBadgeColor = pct >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                               'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300';
    yoyBg = pct >= 0 ? 'bg-emerald-500' : 'bg-red-500';
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
      <KpiCard
        icon={DollarSign}
        color="bg-violet-500"
        title="Monto Total Ejecutado"
        value={`Bs. ${fmt(totalCosto)}`}
        subtitle={`Período ${filters?.year || ''} · ${filters?.grupo === 'T' ? 'Servicios' : filters?.grupo === 'S' ? 'Suministros' : 'S + T consolidado'}`}
        badge="Total"
        badgeColor="bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
      />
      <KpiCard
        icon={TrendingUp}
        color="bg-sky-500"
        title="Promedio Mensual"
        value={`Bs. ${fmt(promMensual)}`}
        subtitle={`Calculado sobre ${mesesConDatos} mes${mesesConDatos !== 1 ? 'es' : ''} con datos`}
        badge="Prom/mes"
        badgeColor="bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
      />
      <KpiCard
        icon={Calendar}
        color="bg-amber-500"
        title="Mes Mayor Ejecución"
        value={mesMayor ? mesMayor.mesNombre : '—'}
        subtitle={mesMayor ? `Bs. ${fmt(mesMayor.costoTotal)} · ${mesMayor.porcentaje}% del total` : 'Sin datos'}
        badge="Máximo"
        badgeColor="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
      />
      <KpiCard
        icon={Building2}
        color="bg-teal-500"
        title="Cobertura Red de Salud"
        value={`${estActivos} establ.`}
        subtitle={`Con actividad de producción en el período seleccionado`}
        badge="Activos"
        badgeColor="bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
      />
      <KpiCard
        icon={ClipboardList}
        color="bg-indigo-500"
        title="Registros de Producción"
        value={fmtInt(totalRegistros)}
        subtitle="Atenciones y suministros registrados en el período"
        badge="Registros"
        badgeColor="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
      />
      <KpiCard
        icon={YoyIcon}
        color={yoyBg}
        title={`Variación vs. ${yoyData ? yoyData.prevYear : 'Anterior'}`}
        value={yoyValue}
        subtitle={yoySubtitle}
        badge="Interanual"
        badgeColor={yoyBadgeColor}
      />
    </div>
  );
}
