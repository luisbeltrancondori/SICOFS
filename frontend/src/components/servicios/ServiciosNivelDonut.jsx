import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, ShieldAlert } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

const COLORS = {
  '1ER. NIVEL': '#00a3e0',
  '2DO. NIVEL': '#0b3b49',
};

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
          <span className="font-bold">{entry.name}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Cantidad:</span>
          <span className="font-extrabold text-white">{formatNumber(entry.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Porcentaje:</span>
          <span className="font-bold text-sky-300">{entry.pct}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ServiciosNivelDonut({ data }) {
  const list = data || [];
  const total = list.reduce((s, d) => s + (d.cantidad || 0), 0);

  const chartData = list.map((d) => ({
    name: d.nivel,
    value: d.cantidad || 0,
    pct: total > 0 ? ((d.cantidad / total) * 100).toFixed(2) : '0',
    color: COLORS[d.nivel] || '#64748b',
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Distribución de servicios por nivel
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Proporción según complejidad de atención
            </p>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
        {total === 0 ? (
          <div className="text-slate-400 text-xs">Sin datos disponibles</div>
        ) : (
          <div className="w-full h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ pct }) => `${pct}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend pills matching the Power BI reference screenshot */}
        <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 w-full">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {d.name}
              </span>
              <span className="font-black text-slate-900 dark:text-white tabular-nums">
                ({d.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
