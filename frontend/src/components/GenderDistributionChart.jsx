import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users2 } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

const COLORS = {
  F: '#ff3b69',
  M: '#00a3e0',
  Femenino: '#ff3b69',
  Masculino: '#00a3e0',
};

const LABEL_MAP = { F: 'Femenino', M: 'Masculino' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-bold">{entry.label}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Pacientes:</span>
          <span className="font-extrabold text-white">{formatNumber(entry.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Proporción:</span>
          <span className="font-bold text-teal-300">{entry.pct}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function GenderDistributionChart({ data, onGenderFilter, selectedSexo }) {
  // data = [{ Sexo: 'F', pacientes: N }, { Sexo: 'M', pacientes: N }]
  const total = data.reduce((s, d) => s + (d.pacientes || 0), 0);

  const chartData = data.map(d => ({
    key: d.Sexo,
    label: LABEL_MAP[d.Sexo] || d.Sexo,
    value: d.pacientes || 0,
    pct: total > 0 ? Math.round((d.pacientes / total) * 100) : 0,
    color: COLORS[d.Sexo] || '#94a3b8',
  }));

  const femEntry = chartData.find(d => d.key === 'F');
  const masEntry = chartData.find(d => d.key === 'M');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Distribución por sexo
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Desglose dinámico según filtros
            </p>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        <div className="w-full h-52 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData.length > 0 ? chartData : [{ label: 'Sin datos', value: 1, pct: 0, color: '#e2e8f0' }]}
                innerRadius={58}
                outerRadius={82}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                dataKey="value"
                strokeWidth={2}
                stroke="#ffffff"
                isAnimationActive={true}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.key}`}
                    fill={entry.color}
                    className="cursor-pointer transition-opacity hover:opacity-85"
                    onClick={() => onGenderFilter && onGenderFilter(entry.key)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
              {formatNumber(total)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pacientes
            </span>
          </div>

          {/* Side indicators */}
          {masEntry && (
            <div className="absolute top-2 left-2 text-left bg-sky-50 dark:bg-sky-950/50 p-1.5 rounded-lg border border-sky-200 dark:border-sky-800/40">
              <span className="block text-xs font-black text-sky-600 dark:text-sky-400">
                {masEntry.pct}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                ({formatNumber(masEntry.value)})
              </span>
            </div>
          )}
          {femEntry && (
            <div className="absolute bottom-2 right-2 text-right bg-pink-50 dark:bg-pink-950/50 p-1.5 rounded-lg border border-pink-200 dark:border-pink-800/40">
              <span className="block text-xs font-black text-pink-600 dark:text-pink-400">
                {femEntry.pct}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                ({formatNumber(femEntry.value)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legend buttons */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-700/60">
        {chartData.map(entry => (
          <button
            key={entry.key}
            onClick={() => onGenderFilter && onGenderFilter(entry.key)}
            className={`flex items-center gap-2 group cursor-pointer px-2 py-1 rounded-lg transition ${
              selectedSexo === entry.key
                ? entry.key === 'F' ? 'bg-pink-100 dark:bg-pink-950/70 ring-1 ring-pink-400' : 'bg-sky-100 dark:bg-sky-950/70 ring-1 ring-sky-400'
                : 'hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <span className="w-3 h-3 rounded-full ring-2" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {entry.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
