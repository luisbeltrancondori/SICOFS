import React, { useState } from 'react';
import { ClipboardList, Search, Download, Eye, ArrowUpDown } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('es-BO');
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// data = [{ rank, nombre, nivel, pacientes, atenciones, Id_Establecimiento }]
export default function FacilityDataTable({ data, selectedMonth, onFacilityClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('pacientes');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = data.filter(f =>
    f.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.nivel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;
    if (typeof aVal === 'string') return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const grandTotal = data.reduce((s, d) => s + (d.pacientes || 0), 0);

  const exportCsv = () => {
    const headers = ['#', 'Establecimiento', 'Nivel', 'Pacientes', 'Atenciones'];
    const rows = sorted.map(f => [f.rank, `"${f.nombre}"`, f.nivel, f.pacientes, f.atenciones]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top_establecimientos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Ranking de establecimientos
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {selectedMonth
                ? `Datos del mes: ${MONTH_NAMES[selectedMonth - 1]}`
                : 'Top establecimientos por pacientes únicos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0e6378] text-white select-none">
              <th className="py-2.5 px-3 font-bold tracking-wide uppercase text-[11px] w-10">#</th>
              <th
                onClick={() => handleSort('nombre')}
                className="py-2.5 px-3 font-bold tracking-wide uppercase text-[11px] cursor-pointer hover:bg-[#0b5163] transition min-w-[200px]"
              >
                <div className="flex items-center justify-between">
                  <span>Establecimiento</span>
                  <ArrowUpDown className="w-3 h-3 text-teal-200" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-bold uppercase text-[11px] min-w-[90px]">Nivel</th>
              <th
                onClick={() => handleSort('pacientes')}
                className="py-2.5 px-3 text-right font-bold uppercase text-[11px] cursor-pointer hover:bg-[#0b5163] transition min-w-[80px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Pacientes</span>
                  <ArrowUpDown className="w-3 h-3 text-teal-200" />
                </div>
              </th>
              <th
                onClick={() => handleSort('atenciones')}
                className="py-2.5 px-3 text-right font-bold uppercase text-[11px] cursor-pointer hover:bg-[#0b5163] transition min-w-[80px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Atenciones</span>
                  <ArrowUpDown className="w-3 h-3 text-teal-200" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-center font-bold text-[11px] w-12 no-print">Ficha</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {sorted.map((fac, idx) => (
              <tr
                key={fac.Id_Establecimiento || idx}
                className={`transition-colors hover:bg-teal-50/50 dark:hover:bg-slate-750 ${
                  idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/70 dark:bg-slate-800/60'
                }`}
              >
                <td className="py-2 px-3 font-bold text-slate-400">
                  <span className={idx < 3 ? 'text-amber-500' : ''}>{fac.rank || idx + 1}</span>
                </td>
                <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-100">
                  <span className="truncate block max-w-[200px]" title={fac.nombre}>{fac.nombre}</span>
                </td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[10px]">{fac.nivel}</td>
                <td className="py-2 px-3 text-right tabular-nums font-bold text-teal-800 dark:text-teal-300">
                  {formatNumber(fac.pacientes)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {formatNumber(fac.atenciones)}
                </td>
                <td className="py-2 px-2 text-center no-print">
                  <button
                    onClick={() => onFacilityClick && onFacilityClick(fac)}
                    className="p-1 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-700 transition"
                    title={`Ver ficha de ${fac.nombre}`}
                  >
                    <Eye className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-[#0e6378] text-white font-extrabold text-xs">
              <td colSpan={3} className="py-2.5 px-3 uppercase tracking-wider">TOTAL</td>
              <td className="py-2.5 px-3 text-right tabular-nums text-amber-300 bg-[#0b5163]">
                {formatNumber(grandTotal)}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                {formatNumber(data.reduce((s, d) => s + (d.atenciones || 0), 0))}
              </td>
              <td className="no-print" />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
