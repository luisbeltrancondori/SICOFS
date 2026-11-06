import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '—';
  return `Bs. ${n.toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;
}

const CustomTooltip = ({ active, payload, label, mode }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-extrabold text-sky-300 mb-1.5">{label}</p>
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-slate-300">Cantidad de Servicios:</span>
          <span className="font-black text-white">{formatNumber(data.cantidad)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-300">Costo Total:</span>
          <span className="font-bold text-emerald-300">{formatCurrency(data.costoTotal)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ServiciosEvolucionMensual({ data, selectedMonth, onSelectMonth }) {
  const [metric, setMetric] = useState('cantidad'); // 'cantidad' or 'costo'
  const list = data || [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Evolución Mensual de Servicios
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tendencia cronológica y volumen otorgado
            </p>
          </div>
        </div>

        {/* Toggle metric */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
          <button
            onClick={() => setMetric('cantidad')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              metric === 'cantidad'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Cantidad
          </button>
          <button
            onClick={() => setMetric('costo')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              metric === 'costo'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Costo (Bs.)
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={list} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="serviciosGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metric === 'cantidad' ? '#0284c7' : '#10b981'} stopOpacity={0.35} />
                <stop offset="95%" stopColor={metric === 'cantidad' ? '#0284c7' : '#10b981'} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis
              dataKey="mesNombre"
              stroke="#94a3b8"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => (metric === 'cantidad' ? `${(v / 1000).toFixed(0)}k` : `${(v / 1000000).toFixed(1)}M`)}
            />
            <Tooltip content={<CustomTooltip mode={metric} />} />
            <Area
              type="monotone"
              dataKey={metric === 'cantidad' ? 'cantidad' : 'costoTotal'}
              stroke={metric === 'cantidad' ? '#0284c7' : '#10b981'}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#serviciosGrad)"
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
