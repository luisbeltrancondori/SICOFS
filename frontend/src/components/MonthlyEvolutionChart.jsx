import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, AreaChart, Area, Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-slate-900/95 text-white backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-bold text-teal-300 mb-1">{label}</p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Pacientes Atendidos:</span>
          <span className="font-extrabold text-white">{formatNumber(val)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomBarLabel = (props) => {
  const { x, y, width, value } = props;
  if (!value && value !== 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="#475569"
      textAnchor="middle"
      fontSize="10"
      fontWeight="700"
    >
      {formatNumber(value)}
    </text>
  );
};

// data = [{ mes (int), mesNombre (str), pacientes, atenciones }]
export default function MonthlyEvolutionChart({ data, selectedMonth, onMonthClick, year }) {
  const [chartType, setChartType] = useState('bar');

  const maxVal = Math.max(...data.map(d => d.pacientes || 0), 10);
  const yAxisMax = Math.ceil(maxVal * 1.18);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Evolución de pacientes atendidos por mes
              </h3>
              {year && (
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/40">
                  {year}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {selectedMonth
                ? `Mes seleccionado (clic para limpiar)`
                : 'Haz clic en un mes para filtrar el resto del dashboard'}
            </p>
          </div>
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-600 text-sky-600 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Barras
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-600 text-sky-600 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Línea
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 mt-2">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Sin datos para los filtros seleccionados
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="barNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="mesNombre"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}
                  domain={[0, yAxisMax]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pacientes"
                  radius={[6, 6, 0, 0]}
                  onClick={(entry) => onMonthClick && onMonthClick(entry.mes)}
                  className="cursor-pointer"
                >
                  {data.map((entry) => {
                    const isActive = selectedMonth && selectedMonth === entry.mes;
                    return (
                      <Cell
                        key={`cell-${entry.mes}`}
                        fill={isActive ? 'url(#barActive)' : 'url(#barNormal)'}
                        stroke={isActive ? '#0d9488' : 'none'}
                        strokeWidth={isActive ? 2 : 0}
                      />
                    );
                  })}
                  <LabelList content={renderCustomBarLabel} />
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="mesNombre"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val}
                  domain={[0, yAxisMax]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="pacientes"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                  dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#0284c7' }}
                >
                  <LabelList content={renderCustomBarLabel} />
                </Area>
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
