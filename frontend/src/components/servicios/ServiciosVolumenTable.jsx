import React, { useMemo } from 'react';
import { Activity, Download } from 'lucide-react';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-BO');
}

function exportCsv(rows) {
  const headers = ['Mes', 'Establecimiento', 'Nivel', 'Servicios otorgados', 'Atenciones (registros)', 'Pacientes únicos', 'Atenciones por paciente'];
  const lines = rows.map((row) => [
    MONTH_NAMES[(row.mes || 1) - 1],
    `"${String(row.establecimiento || '').replaceAll('"', '""')}"`,
    `"${String(row.nivel || '').replaceAll('"', '""')}"`,
    row.cantidad || 0,
    row.atenciones || 0,
    row.pacientesUnicos || 0,
    row.pacientesUnicos ? (row.atenciones || 0) / row.pacientesUnicos : '',
  ]);
  const blob = new Blob([[headers, ...lines].map((line) => line.join(',')).join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'volumen_servicios_por_establecimiento.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function ServiciosVolumenTable({ data, error, selectedMonth }) {
  const rows = useMemo(() => {
    const result = [...(data || [])];
    if (selectedMonth && selectedMonth !== 'all') {
      return result.filter((row) => Number(row.mes) === Number(selectedMonth));
    }
    return result;
  }, [data, selectedMonth]);

  const totalServicios = rows.reduce((sum, row) => sum + (Number(row.cantidad) || 0), 0);
  const totalAtenciones = rows.reduce((sum, row) => sum + (Number(row.atenciones) || 0), 0);

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
      <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Volumen y cantidad de servicios</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Atenciones registradas, pacientes únicos y frecuencia por establecimiento y mes
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => exportCsv(rows)}
          disabled={!rows.length}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-100 dark:border-slate-700/70">
        <div className="rounded-xl bg-sky-50/70 dark:bg-sky-950/30 p-3">
          <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">Servicios otorgados</span>
          <div className="mt-1 text-lg font-black tabular-nums text-sky-700 dark:text-sky-300">{formatNumber(totalServicios)}</div>
        </div>
        <div className="rounded-xl bg-teal-50/70 dark:bg-teal-950/30 p-3">
          <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500 dark:text-slate-400">Atenciones (movimientos)</span>
          <div className="mt-1 text-lg font-black tabular-nums text-teal-700 dark:text-teal-300">{formatNumber(totalAtenciones)}</div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </div>
      )}

      <div className="max-h-[440px] overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[#003844] text-white">
            <tr>
              {['Mes', 'Establecimiento', 'Nivel', 'Servicios', 'Atenciones', 'Pacientes únicos', 'Atenciones / paciente'].map((heading) => (
                <th key={heading} className="px-3 py-2.5 text-right first:text-left font-bold whitespace-nowrap">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
            {rows.length ? rows.map((row, index) => (
              <tr key={`${row.mes}-${row.Id_Establecimiento}-${index}`} className={index % 2 ? 'bg-slate-50/70 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-800'}>
                <td className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">{MONTH_NAMES[(row.mes || 1) - 1] || `M${row.mes}`}</td>
                <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100 min-w-[190px]">{row.establecimiento}</td>
                <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.nivel}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-sky-700 dark:text-sky-300">{formatNumber(row.cantidad)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{formatNumber(row.atenciones)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">{formatNumber(row.pacientesUnicos)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400">
                  {row.pacientesUnicos ? Number(row.atenciones / row.pacientesUnicos).toLocaleString('es-BO', { maximumFractionDigits: 2 }) : '—'}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No hay datos de volumen disponibles para estos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/70">
        Pacientes únicos calculados dentro de cada corte establecimiento-mes; la frecuencia es atenciones registradas por paciente único.
      </p>
    </section>
  );
}
