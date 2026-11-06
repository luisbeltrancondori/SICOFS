import React, { useState } from 'react';
import { DollarSign, Boxes, ArrowUpDown, ChevronRight } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('es-BO');
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '0,00';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MedicamentosRankings({
  data,
  rankingCosto,
  rankingCantidad,
  onSelectMedicine,
}) {
  const [topCostCount, setTopCostCount] = useState(10);
  const [topCantCount, setTopCantCount] = useState(10);

  const list = data || [];

  // Top by Cost
  const sortedByCost = rankingCosto || [...list].sort((a, b) => b.costoTotal - a.costoTotal);
  const displayCost = sortedByCost.slice(0, topCostCount);
  const maxCost = Math.max(...displayCost.map((d) => d.costoTotal || 0), 1);

  // Top by Quantity
  const sortedByCant = rankingCantidad || [...list].sort((a, b) => b.cantidad - a.cantidad);
  const displayCant = sortedByCant.slice(0, topCantCount);
  const maxCant = Math.max(...displayCant.map((d) => d.cantidad || 0), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

      {/* Gráfico A: Top Medicamentos por Costo Total */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Ranking de Medicamentos por Costo Total
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Productos que representan el mayor impacto presupuestario
              </p>
            </div>
          </div>

          {/* Toggle Top 5 / 10 / 20 */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl text-[10px] font-bold">
            {[5, 10, 20].map((num) => (
              <button
                key={num}
                onClick={() => setTopCostCount(num)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  topCostCount === num
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
                }`}
              >
                Top {num}
              </button>
            ))}
          </div>
        </div>

        {/* List of horizontal bars */}
        <div className="space-y-2.5 flex-1">
          {displayCost.map((item, idx) => {
            const pct = Math.min(100, Math.round((item.costoTotal / maxCost) * 100));
            return (
              <div
                key={`${item.idSuministro}-${item.nombreCompleto}-${item.tipoSuministro}`}
                onClick={() => onSelectMedicine && onSelectMedicine(item.nombre)}
                className="group cursor-pointer rounded-xl p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-[340px]">
                    <span className={`w-4 text-[10px] font-black ${idx < 3 ? 'text-amber-500' : 'text-slate-400'}`}>
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {item.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                      ({item.forma})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">
                      {item.porcentajeGasto}% del gasto
                    </span>
                    <span className="font-black text-slate-800 dark:text-white tabular-nums">
                      {formatCurrency(item.costoTotal)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                        : idx === 1
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-600'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gráfico B: Top Medicamentos por Cantidad (Volumen) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Ranking de Medicamentos por Cantidad Dispensada
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Productos con mayor volumen de rotación y demanda física
              </p>
            </div>
          </div>

          {/* Toggle Top 5 / 10 / 20 */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-xl text-[10px] font-bold">
            {[5, 10, 20].map((num) => (
              <button
                key={num}
                onClick={() => setTopCantCount(num)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  topCantCount === num
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-300'
                }`}
              >
                Top {num}
              </button>
            ))}
          </div>
        </div>

        {/* List of horizontal bars */}
        <div className="space-y-2.5 flex-1">
          {displayCant.map((item, idx) => {
            const pct = Math.min(100, Math.round((item.cantidad / maxCant) * 100));
            return (
              <div
                key={`${item.idSuministro}-${item.nombreCompleto}-${item.tipoSuministro}`}
                onClick={() => onSelectMedicine && onSelectMedicine(item.nombre)}
                className="group cursor-pointer rounded-xl p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-[340px]">
                    <span className={`w-4 text-[10px] font-black ${idx < 3 ? 'text-teal-500' : 'text-slate-400'}`}>
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {item.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                      ({item.forma})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.concentracion}
                    </span>
                    <span className="font-black text-slate-800 dark:text-white tabular-nums">
                      {formatNumber(item.cantidad)} unid.
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600'
                        : idx === 1
                        ? 'bg-gradient-to-r from-teal-600 to-emerald-600'
                        : 'bg-gradient-to-r from-teal-400 to-teal-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
