import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';

function fmt(n) {
  if (!n || isNaN(n)) return 'Bs. 0';
  return `Bs. ${Math.round(n).toLocaleString('es-BO')}`;
}
function fmtShort(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return Math.round(n).toLocaleString('es-BO');
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-black text-slate-800 dark:text-white mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-800 dark:text-white">
            {fmt(p.value)}
          </span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
          Total: <span className="font-bold text-slate-800 dark:text-white">{fmt(payload.reduce((a, b) => a + b.value, 0))}</span>
        </div>
      )}
    </div>
  );
};

export default function ProduccionEvolucion({ data = [], selectedMonth, onSelectMonth }) {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [showSplit, setShowSplit] = useState(true);

  // Average line
  const avg = data.length > 0 ? data.reduce((s, d) => s + d.costoTotal, 0) / data.length : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Evolución Mensual de la Producción
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Monto ejecutado por mes · comparación T vs S
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Split toggle */}
          <button
            onClick={() => setShowSplit(!showSplit)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
              showSplit
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
            }`}
          >
            Desglose S/T
          </button>
          {/* Chart type */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl text-[10px] font-bold">
            {[['area','Área'],['bar','Barras']].map(([v,l]) => (
              <button key={v} onClick={() => setChartType(v)}
                className={`px-2 py-0.5 rounded-lg transition-all ${chartType === v ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {chartType === 'area' ? (
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            onClick={d => d?.activePayload && onSelectMonth && onSelectMonth(String(d.activePayload[0]?.payload?.mes))}>
            <defs>
              <linearGradient id="gradT" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
            <XAxis dataKey="mesNombre" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avg} stroke="#7c3aed" strokeDasharray="5 3" strokeOpacity={0.5}
              label={{ value: 'Prom', position: 'right', fontSize: 9, fill: '#7c3aed' }} />
            {showSplit ? (
              <>
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="costoT" name="Servicios (T)" stroke="#7c3aed" strokeWidth={2} fill="url(#gradT)" dot={{ r: 3, fill: '#7c3aed' }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="costoS" name="Suministros (S)" stroke="#0d9488" strokeWidth={2} fill="url(#gradS)" dot={{ r: 3, fill: '#0d9488' }} activeDot={{ r: 5 }} />
              </>
            ) : (
              <Area type="monotone" dataKey="costoTotal" name="Producción Total" stroke="#7c3aed" strokeWidth={2.5} fill="url(#gradTotal)" dot={{ r: 3, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
            )}
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            onClick={d => d?.activePayload && onSelectMonth && onSelectMonth(String(d.activePayload[0]?.payload?.mes))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
            <XAxis dataKey="mesNombre" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avg} stroke="#7c3aed" strokeDasharray="5 3" strokeOpacity={0.5} />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
            {showSplit ? (
              <>
                <Bar dataKey="costoT" name="Servicios (T)" fill="#7c3aed" radius={[3,3,0,0]} maxBarSize={40} />
                <Bar dataKey="costoS" name="Suministros (S)" fill="#0d9488" radius={[3,3,0,0]} maxBarSize={40} />
              </>
            ) : (
              <Bar dataKey="costoTotal" name="Producción Total" fill="#7c3aed" radius={[4,4,0,0]} maxBarSize={50} />
            )}
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Summary pills */}
      {data.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.map(m => {
            const isSel = selectedMonth !== 'all' && String(m.mes) === String(selectedMonth);
            return (
              <button key={m.mes}
                onClick={() => onSelectMonth && onSelectMonth(isSel ? 'all' : String(m.mes))}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                  isSel
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 hover:border-violet-300'
                }`}
              >
                {m.mesNombre}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
