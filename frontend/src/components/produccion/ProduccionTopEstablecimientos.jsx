import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

function fmt(n) {
  if (!n || isNaN(n)) return 'Bs. 0,00';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const NIVEL_COLORS = {
  '2DO. NIVEL': { bar: 'bg-gradient-to-r from-violet-500 to-violet-600', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' },
  '1ER. NIVEL': { bar: 'bg-gradient-to-r from-teal-500 to-teal-600',   badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300' },
};

export default function ProduccionTopEstablecimientos({ data = [], totalCosto = 0, onSelectEstablishment }) {
  const [topN, setTopN] = useState(10);
  const [metric, setMetric] = useState('costo'); // 'costo' | 'registros'

  const sorted = metric === 'costo'
    ? [...data].sort((a, b) => b.costoTotal - a.costoTotal)
    : [...data].sort((a, b) => b.registros - a.registros);

  const display = sorted.slice(0, topN);
  const maxVal  = Math.max(...display.map(d => metric === 'costo' ? d.costoTotal : d.registros), 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Top Establecimientos por Producción
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ranking por monto ejecutado · Red Municipal de Salud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl text-[10px] font-bold">
            {[['costo','Bs.'],['registros','Reg.']].map(([v,l]) => (
              <button key={v} onClick={() => setMetric(v)}
                className={`px-2 py-0.5 rounded-lg transition-all ${metric === v ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
          {/* Top N toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl text-[10px] font-bold">
            {[3, 5, 10].map(n => (
              <button key={n} onClick={() => setTopN(n)}
                className={`px-2 py-0.5 rounded-lg transition-all ${topN === n ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'}`}>
                Top {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bar list */}
      <div className="space-y-3 flex-1">
        {display.map((item, idx) => {
          const val    = metric === 'costo' ? item.costoTotal : item.registros;
          const pct    = Math.min(100, Math.round((val / maxVal) * 100));
          const pctLbl = metric === 'costo'
            ? `${item.porcentaje}% del total`
            : item.registros.toLocaleString('es-BO');
          const colors = NIVEL_COLORS[item.nivel] || NIVEL_COLORS['1ER. NIVEL'];

          return (
            <div key={item.idEstablecimiento}
              onClick={() => onSelectEstablishment && onSelectEstablishment(String(item.idEstablecimiento))}
              className="group cursor-pointer rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 truncate max-w-[65%]">
                  <span className={`w-4 text-[10px] font-black ${idx < 3 ? 'text-violet-500' : 'text-slate-400'}`}>
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {item.nombre}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${colors.badge}`}>
                    {item.nivel.replace('ER.','°').replace('DO.','')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-950/40 px-1.5 rounded">
                    {pctLbl}
                  </span>
                  <span className="font-black text-slate-800 dark:text-white tabular-nums">
                    {metric === 'costo' ? fmt(val) : val.toLocaleString('es-BO')}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {display.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-8">
            Sin datos para los filtros seleccionados
          </div>
        )}
      </div>
    </div>
  );
}
