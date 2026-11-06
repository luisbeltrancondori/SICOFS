import React from 'react';
import {
  X, Building2, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

// facility = { nombre, nivel, pacientes, atenciones, monthlyDetail: [{mes, mesNombre, pacientes, atenciones}] }
export default function FacilityModal({ facility, onClose, year }) {
  if (!facility) return null;

  const monthlyChartData = (facility.monthlyDetail || []).map(m => ({
    mes: m.mesNombre || `M${m.mes}`,
    pacientes: m.pacientes || 0,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#014d5e] to-[#046c82] text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
              <Building2 className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-200 bg-white/10 px-2 py-0.5 rounded-full">
                {facility.nivel || 'Establecimiento'} • Gestión {year}
              </span>
              <h2 className="text-lg font-extrabold mt-1 tracking-tight">
                {facility.nombre}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pacientes únicos</span>
              <p className="text-xl font-extrabold text-teal-700 dark:text-teal-300 mt-0.5">
                {formatNumber(facility.pacientes)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total atenciones</span>
              <p className="text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">
                {formatNumber(facility.atenciones)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Promedio mensual</span>
              <p className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5">
                {monthlyChartData.length > 0
                  ? formatNumber(Math.round(monthlyChartData.reduce((s, m) => s + m.pacientes, 0) / monthlyChartData.length))
                  : '—'}
              </p>
            </div>
          </div>

          {/* Monthly mini-chart */}
          {monthlyChartData.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Distribución de pacientes por mes
              </h4>
              <div className="h-44 w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                      formatter={(val) => [formatNumber(val), 'Pacientes']}
                    />
                    <Bar dataKey="pacientes" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {monthlyChartData.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Cargando detalle mensual...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
