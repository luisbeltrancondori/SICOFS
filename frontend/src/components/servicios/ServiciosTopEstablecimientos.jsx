import React, { useState } from 'react';
import { BarChart3, Building2 } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

export default function ServiciosTopEstablecimientos({ data, onSelectFacility }) {
  const [topCount, setTopCount] = useState(3); // Default Top 3 matching Power BI reference
  const list = data || [];
  const displayList = list.slice(0, topCount);
  const maxVal = Math.max(...displayList.map((d) => d.cantidad || 0), 10);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 flex flex-col h-full transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
              Top {topCount} Establecimientos por Cantidad de Servicios
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              Ranking de producción según atenciones registradas
            </p>
          </div>
        </div>

        {/* Toggle Top 3 / Top 10 */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setTopCount(3)}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              topCount === 3
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
            }`}
          >
            Top 3
          </button>
          <button
            onClick={() => setTopCount(10)}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              topCount === 10
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
            }`}
          >
            Top 10
          </button>
        </div>
      </div>

      {/* Horizontal Bar List matching Power BI look */}
      <div className="flex-1 flex flex-col justify-center space-y-3 mt-1">
        {displayList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs py-6">
            Sin datos para los filtros seleccionados
          </div>
        ) : (
          displayList.map((fac, idx) => {
            const val = fac.cantidad || 0;
            const percentage = Math.min(100, Math.round((val / maxVal) * 100));

            return (
              <div
                key={fac.Id_Establecimiento || idx}
                onClick={() => onSelectFacility && onSelectFacility(fac)}
                className="group cursor-pointer rounded-xl p-1.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-750"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 truncate max-w-[240px] sm:max-w-[320px]">
                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-200 truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors uppercase">
                      {fac.nombre}
                    </span>
                  </div>
                  <span className="font-black text-xs text-slate-800 dark:text-white tabular-nums ml-2">
                    {formatNumber(val)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-[#0077b6] hover:bg-[#0096c7]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Axis indicator matching Power BI screenshot */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
        <span>0</span>
        <span>20.000</span>
        <span>40.000</span>
        <span>60.000</span>
        <span>80.000</span>
      </div>
    </div>
  );
}
