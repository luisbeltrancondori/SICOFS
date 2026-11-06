import React, { useState } from 'react';
import { Layers, Stethoscope, ArrowRight } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

export default function ServiciosCategoriasChart({ serviciosPorTipo, serviciosPorGrupo }) {
  const [activeTab, setActiveTab] = useState('tipo'); // 'tipo' or 'grupo'

  const data = activeTab === 'tipo' ? (serviciosPorTipo || []) : (serviciosPorGrupo || []);
  const maxVal = Math.max(...data.map(d => d.cantidad || 0), 10);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col h-full transition-all">
      {/* Header with Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            {activeTab === 'tipo' ? <Stethoscope className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {activeTab === 'tipo' ? 'Servicios por Tipo de Servicio' : 'Servicios por Grupo de Procedimiento'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Desglose analítico de producción clínica
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('tipo')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'tipo'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Por Tipo
          </button>
          <button
            onClick={() => setActiveTab('grupo')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'grupo'
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Por Grupo
          </button>
        </div>
      </div>

      {/* Bar List */}
      <div className="flex-1 flex flex-col justify-between space-y-2.5 mt-1">
        {data.slice(0, 7).map((item, idx) => {
          const label = activeTab === 'tipo' ? item.tipoServicio : item.grupoProcedimiento;
          const val = item.cantidad || 0;
          const pct = Math.min(100, Math.round((val / maxVal) * 100));

          return (
            <div key={label || idx} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[260px]" title={label}>
                  {label}
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {formatNumber(val)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
