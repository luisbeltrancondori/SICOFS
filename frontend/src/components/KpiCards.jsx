import React from 'react';
import { Users, Calendar, TrendingUp, Building2, ArrowUpRight } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function KpiCards({ kpis, year, selectedMonth, monthlyData }) {
  const totalPacientes = kpis?.totalPacientes ?? 0;
  const totalAtenciones = kpis?.totalAtenciones ?? 0;
  const promedio = kpis?.promedioPacientesMes ?? 0;

  // Peak month from monthlyData
  const peakEntry = monthlyData.length > 0
    ? monthlyData.reduce((max, d) => d.pacientes > max.pacientes ? d : max, monthlyData[0])
    : null;
  const peakMes = peakEntry ? MONTH_NAMES[(peakEntry.mes || 1) - 1] : '—';
  const peakPacientes = peakEntry?.pacientes ?? 0;

  const cards = [
    {
      id: 'kpi-total',
      title: 'TOTAL PACIENTES ATENDIDOS',
      value: formatNumber(totalPacientes),
      unit: `Gestión ${year}${selectedMonth ? ` • ${MONTH_NAMES[selectedMonth - 1]}` : ''}`,
      icon: Users,
      accentBorder: 'border-l-[6px] border-l-sky-500',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
      badge: 'Pacientes únicos',
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200',
    },
    {
      id: 'kpi-atenciones',
      title: 'TOTAL ATENCIONES',
      value: formatNumber(totalAtenciones),
      unit: 'Registros de atención',
      icon: Calendar,
      accentBorder: 'border-l-[6px] border-l-teal-500',
      iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
      badge: 'Servicios',
      badgeColor: 'text-teal-700 bg-teal-50 border-teal-200',
    },
    {
      id: 'kpi-promedio',
      title: 'PROMEDIO MENSUAL',
      value: formatNumber(promedio),
      unit: 'Pacientes por mes',
      icon: TrendingUp,
      accentBorder: 'border-l-[6px] border-l-blue-600',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      badge: 'Pacientes/mes',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      id: 'kpi-peak',
      title: 'MES DE MAYOR ATENCIÓN',
      value: peakMes,
      unit: `${formatNumber(peakPacientes)} pacientes`,
      icon: Building2,
      accentBorder: 'border-l-[6px] border-l-purple-500',
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
      badge: 'Pico',
      badgeColor: 'text-purple-700 bg-purple-50 border-purple-200',
    }
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 ${card.accentBorder} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 uppercase leading-snug">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.iconBg} group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-1 flex items-baseline justify-between">
              <div>
                <div className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {card.unit}
                </div>
              </div>

              <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                <ArrowUpRight className="w-3 h-3" />
                <span>{card.badge}</span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
