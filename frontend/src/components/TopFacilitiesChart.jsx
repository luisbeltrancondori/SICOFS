import React from 'react';
import { Award } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function TopFacilitiesChart({ data, selectedMonth, onFacilityClick }) {
  // data = [{ Id_Establecimiento, nombre, nivel, pacientes, atenciones }]
  const maxValue = Math.max(...data.map(d => d.pacientes || 0), 10);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Top 10 establecimientos por pacientes
              </h3>
              {selectedMonth && (
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/40">
                  {MONTH_NAMES[selectedMonth - 1]?.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ranking de demanda según filtros aplicados
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Bar List */}
      <div className="flex-1 flex flex-col justify-between space-y-1.5 mt-1">
        {data.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Sin datos para los filtros seleccionados
          </div>
        )}
        {data.map((fac, idx) => {
          const val = fac.pacientes || 0;
          const percentage = Math.min(100, Math.round((val / maxValue) * 100));

          return (
            <div
              key={fac.Id_Establecimiento || idx}
              onClick={() => onFacilityClick && onFacilityClick(fac)}
              className="group cursor-pointer rounded-xl p-1.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-750"
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <div className="flex items-center gap-1.5 truncate max-w-[210px] sm:max-w-[240px]">
                  <span className={`w-4 text-[10px] font-bold ${idx < 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {idx + 1}
                  </span>
                  <span
                    className="font-bold truncate text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400"
                    title={fac.nombre}
                  >
                    {fac.nombre}
                  </span>
                </div>
                <span className="font-extrabold ml-2 text-slate-800 dark:text-slate-200">
                  {formatNumber(val)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600'
                      : idx === 1
                      ? 'bg-gradient-to-r from-sky-400 to-sky-600'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.max(2, percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
