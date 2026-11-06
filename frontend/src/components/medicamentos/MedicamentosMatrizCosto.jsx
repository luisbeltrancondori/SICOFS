import React, { useState, useMemo } from 'react';
import { Table, Search, Download, ArrowUpDown, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('es-BO');
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return 'Bs. 0,00';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTH_NAMES = [
  { id: 1, label: 'Ene' },
  { id: 2, label: 'Feb' },
  { id: 3, label: 'Mar' },
  { id: 4, label: 'Abr' },
  { id: 5, label: 'May' },
  { id: 6, label: 'Jun' },
  { id: 7, label: 'Jul' },
  { id: 8, label: 'Ago' },
  { id: 9, label: 'Sep' },
  { id: 10, label: 'Oct' },
  { id: 11, label: 'Nov' },
  { id: 12, label: 'Dic' },
];

export default function MedicamentosMatrizCosto({ data, selectedMonth }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('totalCosto');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const list = data || [];

  // Active months
  const activeMonths = useMemo(() => {
    if (selectedMonth && selectedMonth !== 'all') {
      const parsed = parseInt(selectedMonth, 10);
      return MONTH_NAMES.filter((m) => m.id === parsed);
    }
    const found = new Set();
    list.forEach((item) => {
      if (item.meses) {
        Object.entries(item.meses).forEach(([mId, v]) => {
          if (v && v.costo > 0) found.add(parseInt(mId, 10));
        });
      }
    });
    if (found.size > 0) {
      return MONTH_NAMES.filter((m) => found.has(m.id));
    }
    return MONTH_NAMES;
  }, [list, selectedMonth]);

  // Filter
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(
      (m) =>
        m.nombre?.toLowerCase().includes(lower) ||
        m.forma?.toLowerCase().includes(lower) ||
        m.concentracion?.toLowerCase().includes(lower) ||
        m.tipoSuministro?.toLowerCase().includes(lower)
    );
  }, [list, searchTerm]);

  // Compute row visible cost
  const processed = useMemo(() => {
    return filtered.map((item) => {
      const rowSum = activeMonths.reduce((sum, m) => sum + (item.meses?.[m.id]?.costo || 0), 0);
      return {
        ...item,
        visibleCosto: rowSum,
      };
    });
  }, [filtered, activeMonths]);

  // Calculate highest cell cost for conditional formatting
  const maxCellCost = useMemo(() => {
    let max = 1;
    processed.forEach((item) => {
      activeMonths.forEach((m) => {
        const val = item.meses?.[m.id]?.costo || 0;
        if (val > max) max = val;
      });
    });
    return max;
  }, [processed, activeMonths]);

  // Sort
  const sorted = useMemo(() => {
    return [...processed].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'totalCosto') {
        aVal = a.visibleCosto;
        bVal = b.visibleCosto;
      }
      aVal = aVal ?? 0;
      bVal = bVal ?? 0;
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [processed, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Month totals
  const monthTotals = useMemo(() => {
    const totals = {};
    for (const m of activeMonths) {
      totals[m.id] = sorted.reduce((sum, item) => sum + (item.meses?.[m.id]?.costo || 0), 0);
    }
    return totals;
  }, [sorted, activeMonths]);

  const grandTotal = useMemo(
    () => sorted.reduce((sum, item) => sum + item.visibleCosto, 0),
    [sorted]
  );

  const exportCsv = () => {
    const headers = [
      'Medicamento / Suministro',
      'Forma Farmacéutica',
      'Concentración',
      'Tipo de Suministro',
      ...activeMonths.map((m) => `${m.label} (Costo Bs.)`),
      'Total Anual (Bs.)',
    ];

    const rows = sorted.map((item) => [
      `"${item.nombre}"`,
      `"${item.forma}"`,
      `"${item.concentracion}"`,
      `"${item.tipoSuministro}"`,
      ...activeMonths.map((m) => (item.meses?.[m.id]?.costo || 0).toFixed(2)),
      item.visibleCosto.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matriz_costo_medicamentos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden transition-all mb-5 flex flex-col">
      {/* Toolbar */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Tabla 2: Costo de Medicamentos por Mes</span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">
                Ejecución Presupuestaria (Bs.)
              </span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              Matriz financiera mensual de gasto ejecutado por producto ({sorted.length} productos)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar medicamento..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            onClick={exportCsv}
            title="Exportar a CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 select-none">
            <tr className="bg-[#003844] text-white">
              <th
                onClick={() => handleSort('nombre')}
                className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[240px] cursor-pointer hover:bg-[#002f3a] transition border-r border-teal-800"
              >
                <div className="flex items-center justify-between">
                  <span>Medicamento / Insumo</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-teal-300" />
                </div>
              </th>

              <th className="py-2.5 px-2.5 font-bold uppercase tracking-wider text-[10px] min-w-[100px] border-r border-teal-800">
                Presentación
              </th>

              {activeMonths.map((m) => (
                <th
                  key={m.id}
                  className="py-2 px-2 text-right font-black uppercase text-[10px] border-r border-teal-800 bg-[#004757] min-w-[85px]"
                >
                  {m.label} (Bs.)
                </th>
              ))}

              <th
                onClick={() => handleSort('totalCosto')}
                className="py-2 px-3 text-right font-black uppercase text-[10px] bg-[#025669] cursor-pointer hover:bg-[#014757] min-w-[110px]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total (Bs.)</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-300" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={activeMonths.length + 3} className="py-12 text-center text-slate-400 text-xs">
                  No se encontraron medicamentos para los filtros activos
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => (
                <tr
                  key={`${item.idSuministro}-${item.nombreCompleto}-${item.tipoSuministro}`}
                  className={`transition-colors hover:bg-amber-50/50 dark:hover:bg-slate-750 ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/70 dark:bg-slate-800/60'
                  }`}
                >
                  <td className="py-2 px-3.5 font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">
                    <span className="truncate block max-w-[260px]" title={item.nombreCompleto}>
                      {item.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal block truncate">
                      {item.concentracion !== '—' ? item.concentracion : item.tipoSuministro}
                    </span>
                  </td>

                  <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <span className="truncate block max-w-[100px]">
                      {item.forma}
                    </span>
                  </td>

                  {activeMonths.map((m) => {
                    const costo = item.meses?.[m.id]?.costo;
                    const hasCosto = costo && costo > 0;
                    const heatRatio = hasCosto ? costo / maxCellCost : 0;
                    return (
                      <td
                        key={`cell-${item.idSuministro}-${item.nombreCompleto}-${m.id}`}
                        className={`py-1.5 px-2 text-right tabular-nums border-r border-slate-100 dark:border-slate-700/60 ${
                          heatRatio > 0.3
                            ? 'bg-amber-100/60 dark:bg-amber-950/40 font-bold text-amber-900 dark:text-amber-200'
                            : heatRatio > 0.1
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {hasCosto ? formatCurrency(costo) : 'Bs. 0,00'}
                      </td>
                    );
                  })}

                  <td className="py-1.5 px-3 text-right tabular-nums font-black text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                    {formatCurrency(item.visibleCosto)}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Footer */}
          <tfoot className="sticky bottom-0 z-10">
            <tr className="bg-[#003844] text-white font-black text-xs select-none shadow-md">
              <td colSpan={2} className="py-2.5 px-3.5 uppercase tracking-wider border-r border-teal-800">
                Total Presupuesto Ejecutado
              </td>

              {activeMonths.map((m) => (
                <td
                  key={`tot-${m.id}`}
                  className="py-2.5 px-2 text-right tabular-nums text-amber-300 border-r border-teal-800 font-extrabold text-[11px]"
                >
                  {formatCurrency(monthTotals[m.id])}
                </td>
              ))}

              <td className="py-2.5 px-3 text-right tabular-nums text-emerald-300 bg-[#002f3a] font-black text-[12px]">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando página {currentPage} de {totalPages} ({sorted.length} registros)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-700 dark:text-slate-200">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
