import React, { useMemo } from 'react';
import { AlertTriangle, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-BO');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ServiciosAnaliticaEjecutiva({ monthlyData, distributionByLevel }) {
  const monthlyRows = useMemo(() => [...(monthlyData || [])].sort((a, b) => a.mes - b.mes), [monthlyData]);
  const averageQuantity = monthlyRows.length
    ? monthlyRows.reduce((sum, row) => sum + (Number(row.cantidad) || 0), 0) / monthlyRows.length
    : 0;
  const averageCost = monthlyRows.length
    ? monthlyRows.reduce((sum, row) => sum + (Number(row.costoTotal) || 0), 0) / monthlyRows.length
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"><BarChart3 className="w-4 h-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Eficiencia financiera y resumen por nivel</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Costo efectivo por servicio y participación en la ejecución</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#003844] text-white">
              <tr>
                <th className="px-4 py-2.5">Nivel de atención</th>
                <th className="px-3 py-2.5 text-right">Servicios</th>
                <th className="px-3 py-2.5 text-right">Costo ejecutado</th>
                <th className="px-3 py-2.5 text-right">Costo / servicio</th>
                <th className="px-3 py-2.5 text-right">Parte del gasto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
              {(distributionByLevel || []).map((row, index, all) => {
                const totalCost = all.reduce((sum, item) => sum + (Number(item.costoTotal) || 0), 0);
                const quantity = Number(row.cantidad) || 0;
                const cost = Number(row.costoTotal) || 0;
                return (
                  <tr key={row.nivel} className={index % 2 ? 'bg-slate-50/70 dark:bg-slate-800/60' : ''}>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{row.nivel}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(quantity)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">Bs. {formatCurrency(cost)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-indigo-700 dark:text-indigo-300">{quantity ? `Bs. ${formatCurrency(cost / quantity)}` : '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{totalCost ? `${((cost / totalCost) * 100).toLocaleString('es-BO', { maximumFractionDigits: 1 })}%` : '—'}</td>
                  </tr>
                );
              })}
              {!distributionByLevel?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin datos de nivel para estos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/70">
          El costo por servicio permite comparar niveles, pero debe interpretarse junto con su complejidad y cartera de prestaciones.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"><AlertTriangle className="w-4 h-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Ritmo mensual y señales de variación</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Volumen y gasto frente al mes anterior y al promedio del período visible</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-100 dark:border-slate-700/70">
          <div className="rounded-xl bg-sky-50/70 dark:bg-sky-950/30 p-3">
            <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">Promedio mensual de servicios</span>
            <div className="mt-1 text-lg font-black tabular-nums text-sky-700 dark:text-sky-300">{formatNumber(averageQuantity)}</div>
          </div>
          <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 p-3">
            <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">Promedio mensual de costo</span>
            <div className="mt-1 text-lg font-black tabular-nums text-amber-700 dark:text-amber-300">Bs. {formatCurrency(averageCost)}</div>
          </div>
        </div>
        <div className="max-h-[300px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#003844] text-white">
              <tr>
                <th className="px-4 py-2.5">Mes</th>
                <th className="px-3 py-2.5 text-right">Servicios</th>
                <th className="px-3 py-2.5 text-right">Costo (Bs.)</th>
                <th className="px-3 py-2.5 text-right">Cambio de volumen</th>
                <th className="px-3 py-2.5 text-right">Señal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
              {monthlyRows.map((row, index) => {
                const previous = monthlyRows[index - 1];
                const previousQuantity = Number(previous?.cantidad) || 0;
                const quantity = Number(row.cantidad) || 0;
                const change = previousQuantity ? ((quantity - previousQuantity) / previousQuantity) * 100 : null;
                const isAlert = change !== null && Math.abs(change) >= 20;
                return (
                  <tr key={row.mes} className={isAlert ? 'bg-amber-50/70 dark:bg-amber-950/20' : (index % 2 ? 'bg-slate-50/70 dark:bg-slate-800/60' : '')}>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{row.mesNombre}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(quantity)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(row.costoTotal)}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${isAlert ? 'font-bold text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {change === null ? '—' : `${change > 0 ? '+' : ''}${change.toLocaleString('es-BO', { maximumFractionDigits: 1 })}%`}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {change === null ? <span className="text-slate-400">Base</span> : isAlert ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300"><AlertTriangle className="w-3 h-3" /> Revisar</span>
                      ) : change > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><TrendingUp className="w-3 h-3" /> Estable</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400"><TrendingDown className="w-3 h-3" /> Estable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!monthlyRows.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin serie mensual para comparar.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/70">
          “Revisar” marca cambios de volumen de 20% o más frente al mes previo; es una alerta de monitoreo, no un diagnóstico. Con un único mes no hay comparación.
        </p>
      </section>
    </div>
  );
}
