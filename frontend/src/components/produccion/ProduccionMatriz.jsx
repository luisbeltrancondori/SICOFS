import React, { useState, useMemo } from 'react';
import { Table2, Download } from 'lucide-react';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmt(n) {
  if (!n || isNaN(n) || n === 0) return '';
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtCell(n) {
  if (!n || isNaN(n) || n === 0) return <span className="text-slate-200 dark:text-slate-700">—</span>;
  return <span>Bs. {fmt(n)}</span>;
}

function getHeatColor(val, max) {
  if (!val || val === 0 || !max) return '';
  const ratio = val / max;
  if (ratio > 0.8) return 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 font-bold';
  if (ratio > 0.5) return 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-semibold';
  if (ratio > 0.2) return 'text-slate-700 dark:text-slate-200';
  return 'text-slate-500 dark:text-slate-400';
}

export default function ProduccionMatriz({ data = [], selectedMonth }) {
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // Detect which months have data
  const activeMonths = useMemo(() => {
    const set = new Set();
    data.forEach(row => Object.keys(row.meses || {}).forEach(m => set.add(Number(m))));
    return Array.from(set).sort((a, b) => a - b);
  }, [data]);

  const displayMonths = selectedMonth !== 'all'
    ? [Number(selectedMonth)]
    : activeMonths;

  // Max value for heat-map
  const maxVal = useMemo(() => {
    let m = 0;
    data.forEach(row => {
      displayMonths.forEach(mes => { if ((row.meses?.[mes] || 0) > m) m = row.meses[mes]; });
    });
    return m;
  }, [data, displayMonths]);

  // Column totals
  const colTotals = useMemo(() => {
    const totals = {};
    displayMonths.forEach(mes => {
      totals[mes] = data.reduce((s, row) => s + (row.meses?.[mes] || 0), 0);
    });
    totals['total'] = data.reduce((s, row) => s + (row.total || 0), 0);
    return totals;
  }, [data, displayMonths]);

  const totalPages = Math.ceil(data.length / PER_PAGE);
  const pageData   = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // CSV export
  const handleExport = () => {
    const header = ['Establecimiento', 'Nivel', ...displayMonths.map(m => MONTH_NAMES[m - 1]), 'TOTAL'];
    const rows = data.map(row => [
      `"${row.nombre}"`, row.nivel,
      ...displayMonths.map(m => (row.meses?.[m] || 0).toFixed(2)),
      (row.total || 0).toFixed(2),
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'produccion_matriz.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Table2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Matriz: Monto Ejecutado por Establecimiento y Mes
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {data.length} establecimientos · {displayMonths.length} mes{displayMonths.length !== 1 ? 'es' : ''}
              {' '}· Intensidad de color = mayor ejecución
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl
            bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300
            border border-violet-200 dark:border-violet-800 hover:bg-violet-100 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </button>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-4 py-3 font-black text-slate-600 dark:text-slate-300 min-w-[200px] sticky left-0 bg-slate-50 dark:bg-slate-900/50 z-10">
                Establecimiento de Salud
              </th>
              <th className="text-center px-3 py-3 font-black text-slate-600 dark:text-slate-300 min-w-[80px]">
                Nivel
              </th>
              {displayMonths.map(m => (
                <th key={m} className="text-right px-3 py-3 font-black text-slate-600 dark:text-slate-300 min-w-[90px]">
                  {MONTH_NAMES[m - 1]}
                </th>
              ))}
              <th className="text-right px-4 py-3 font-black text-violet-700 dark:text-violet-300 min-w-[110px] bg-violet-50/50 dark:bg-violet-950/20">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {pageData.map((row, idx) => (
              <tr key={row.idEstablecimiento}
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-900/20'}`}
              >
                <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700/40">
                  {row.nombre}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    row.nivel?.includes('2DO') ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                  }`}>
                    {row.nivel?.includes('2DO') ? '2°' : '1°'}
                  </span>
                </td>
                {displayMonths.map(m => {
                  const val = row.meses?.[m] || 0;
                  return (
                    <td key={m} className={`px-3 py-2.5 text-right tabular-nums ${getHeatColor(val, maxVal)}`}>
                      {fmtCell(val)}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-right font-black tabular-nums text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-950/20">
                  {row.total > 0 ? `Bs. ${fmt(row.total)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Column totals footer */}
          <tfoot>
            <tr className="border-t-2 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30">
              <td className="px-4 py-3 font-black text-violet-800 dark:text-violet-200 sticky left-0 bg-violet-50 dark:bg-violet-950/30 z-10">
                TOTAL GENERAL
              </td>
              <td />
              {displayMonths.map(m => (
                <td key={m} className="px-3 py-3 text-right font-black text-violet-700 dark:text-violet-300 tabular-nums text-[11px]">
                  {colTotals[m] > 0 ? `Bs. ${fmt(colTotals[m])}` : '—'}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-black text-violet-800 dark:text-violet-100 text-[11px] bg-violet-100 dark:bg-violet-900/40">
                Bs. {fmt(colTotals['total'])}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Página {page} de {totalPages} · {data.length} establecimientos
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold"
            >‹ Ant.</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-2.5 py-1.5 rounded-lg border font-bold transition-colors ${
                  page === p
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}>
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-bold"
            >Sig. ›</button>
          </div>
        </div>
      )}
    </div>
  );
}
