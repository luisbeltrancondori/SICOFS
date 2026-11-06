import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Search, Download, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, 
  AlertTriangle, ShieldCheck, Flame, Zap, Award 
} from 'lucide-react';

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

export default function MedicamentosTablaDetalle({
  data,
  matrixData,
  selectedMonth,
  year,
  totalGastoGeneral,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('costoTotal');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const itemsPerPage = 20;

  const list = data || [];
  const totalGasto = totalGastoGeneral || list.reduce((s, d) => s + (d.costoTotal || 0), 0);

  // Compute Pareto cumulative % on cost-sorted items
  const sortedByCost = useMemo(() => {
    const copy = [...list].sort((a, b) => (b.costoTotal || 0) - (a.costoTotal || 0));
    let cumulative = 0;
    return copy.map((item) => {
      cumulative += item.costoTotal || 0;
      const cumPct = totalGasto > 0 ? Number(((cumulative / totalGasto) * 100).toFixed(1)) : 0;
      return {
        ...item,
        cumPct,
        isPareto80: cumPct <= 80,
      };
    });
  }, [list, totalGasto]);

  // How many items make up 80%?
  const pareto80Count = useMemo(() => {
    return sortedByCost.filter((m) => m.isPareto80).length;
  }, [sortedByCost]);

  // Filter
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return sortedByCost;
    const lower = searchTerm.toLowerCase();
    return sortedByCost.filter(
      (m) =>
        m.nombre?.toLowerCase().includes(lower) ||
        m.forma?.toLowerCase().includes(lower) ||
        m.concentracion?.toLowerCase().includes(lower) ||
        m.tipoSuministro?.toLowerCase().includes(lower)
    );
  }, [sortedByCost, searchTerm]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, sortField, sortAsc]);

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

  const exportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError('');

    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SICOFS';
      workbook.created = new Date();

      const detailSheet = workbook.addWorksheet('Detalle analítico', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      const detailHeaders = [
        'Medicamento / Insumo',
        'Forma Farmacéutica',
        'Concentración',
        'Tipo de Suministro',
        'Cantidad Total',
        'Costo Unitario Promedio (Bs.)',
        'Costo Total (Bs.)',
        '% del Gasto Total',
        '% Acumulado Pareto',
        'Recetas Distintas',
      ];
      detailSheet.addRow(detailHeaders);
      detailSheet.addRows(sortedByCost.map((item) => [
        item.nombre || '',
        item.forma || '',
        item.concentracion || '',
        item.tipoSuministro || '',
        item.cantidad || 0,
        item.costoUnitarioPromedio || 0,
        item.costoTotal || 0,
        item.porcentajeGasto || 0,
        item.cumPct || 0,
        item.recetas || 0,
      ]));
      detailSheet.getColumn(5).numFmt = '#,##0';
      [6, 7].forEach((column) => { detailSheet.getColumn(column).numFmt = '#,##0.00'; });
      [8, 9].forEach((column) => { detailSheet.getColumn(column).numFmt = '0.00"%"'; });

      const monthsWithCost = MONTH_NAMES.filter((month) =>
        (matrixData || []).some((item) => (item.meses?.[month.id]?.costo || 0) > 0)
      );
      const monthColumns = selectedMonth && selectedMonth !== 'all'
        ? MONTH_NAMES.filter((month) => month.id === parseInt(selectedMonth, 10))
        : monthsWithCost.length > 0 ? monthsWithCost : MONTH_NAMES;
      const matrixSheet = workbook.addWorksheet('Presupuesto ejecutado', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });
      const matrixHeaders = [
        'Medicamento / Suministro',
        'Forma Farmacéutica',
        'Concentración',
        'Tipo de Suministro',
        ...monthColumns.map((month) => `${month.label} (Bs.)`),
        'Total Presupuesto Ejecutado (Bs.)',
      ];
      matrixSheet.addRow(matrixHeaders);
      const allMatrixRows = (matrixData || []).map((item) => {
        const monthCosts = monthColumns.map((month) => item.meses?.[month.id]?.costo || 0);
        return [
          item.nombre || '',
          item.forma || '',
          item.concentracion || '',
          item.tipoSuministro || '',
          ...monthCosts,
          monthCosts.reduce((sum, cost) => sum + cost, 0),
        ];
      });
      matrixSheet.addRows(allMatrixRows);
      const totalRow = matrixSheet.addRow([
        'Total Presupuesto Ejecutado',
        '',
        '',
        '',
        ...monthColumns.map((month, monthIndex) => allMatrixRows.reduce(
          (sum, row) => sum + (row[4 + monthIndex] || 0),
          0
        )),
        allMatrixRows.reduce((sum, row) => sum + (row[row.length - 1] || 0), 0),
      ]);
      totalRow.font = { bold: true };
      for (let column = 5; column <= matrixHeaders.length; column += 1) {
        matrixSheet.getColumn(column).numFmt = '#,##0.00';
      }

      [detailSheet, matrixSheet].forEach((sheet) => {
        const header = sheet.getRow(1);
        header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        header.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF003844' },
        };
        sheet.columns.forEach((column, index) => {
          const maxLength = sheet.getColumn(index + 1).values.reduce((max, value) => {
            const cellValue = value && typeof value === 'object' && 'text' in value
              ? value.text
              : value;
            return Math.max(max, String(cellValue ?? '').length);
          }, String(column.header || '').length);
          column.width = Math.min(Math.max(maxLength + 2, 12), 48);
        });
        sheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: sheet.rowCount - (sheet === matrixSheet ? 1 : 0), column: sheet.columnCount },
        };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medicamentos_${year || 'reporte'}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error al exportar el reporte de medicamentos:', err);
      setExportError('No se pudo generar el archivo Excel. Intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden transition-all mb-6 flex flex-col">
      {/* Pareto 80/20 Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/30 border border-purple-400/40 text-purple-200">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>Análisis de Impacto Presupuestario (Pareto 80/20)</span>
              <span className="text-[10px] bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full font-bold">
                Alta Prioridad
              </span>
            </h4>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Solo <strong>{pareto80Count} medicamentos</strong> de los {list.length} analizados concentran el <strong>80% del gasto total municipal</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 text-center">
            <span className="text-[10px] text-purple-200 uppercase font-bold block">Medicamentos Clave</span>
            <span className="text-base font-black text-white tabular-nums">{pareto80Count} productos</span>
          </div>
          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 text-center">
            <span className="text-[10px] text-purple-200 uppercase font-bold block">Concentración</span>
            <span className="text-base font-black text-amber-300 tabular-nums">80,0% del Gasto</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
              Tabla 3: Detalle Analítico de Medicamentos
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              Costo unitario promedio, volumen, impacto acumulado y frecuencia en recetas ({sorted.length} registros)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            onClick={exportExcel}
            disabled={exporting}
            title="Exportar todos los registros a Excel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-wait text-white transition shadow-xs shrink-0"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exporting ? 'Cargando...' : 'Excel'}</span>
          </button>
        </div>
        {exportError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">{exportError}</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 select-none">
            <tr className="bg-[#003844] text-white">
              <th
                onClick={() => handleSort('nombre')}
                className="py-2.5 px-3.5 font-bold uppercase tracking-wider text-[11px] min-w-[220px] cursor-pointer hover:bg-[#002f3a] transition border-r border-teal-800"
              >
                <div className="flex items-center justify-between">
                  <span>Medicamento</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-teal-300" />
                </div>
              </th>

              <th className="py-2.5 px-2 font-bold uppercase tracking-wider text-[10px] min-w-[90px] border-r border-teal-800">
                Forma
              </th>

              <th className="py-2.5 px-2 font-bold uppercase tracking-wider text-[10px] min-w-[120px] border-r border-teal-800">
                Tipo Suministro
              </th>

              <th
                onClick={() => handleSort('cantidad')}
                className="py-2.5 px-2.5 text-right font-black uppercase text-[10px] border-r border-teal-800 cursor-pointer hover:bg-[#002f3a]"
              >
                Cantidad
              </th>

              <th
                onClick={() => handleSort('costoUnitarioPromedio')}
                className="py-2.5 px-2.5 text-right font-black uppercase text-[10px] border-r border-teal-800 cursor-pointer hover:bg-[#002f3a]"
              >
                Costo Unit. Prom.
              </th>

              <th
                onClick={() => handleSort('costoTotal')}
                className="py-2.5 px-2.5 text-right font-black uppercase text-[10px] border-r border-teal-800 cursor-pointer hover:bg-[#002f3a] text-amber-300"
              >
                Costo Total (Bs.)
              </th>

              <th
                onClick={() => handleSort('porcentajeGasto')}
                className="py-2.5 px-2 text-right font-black uppercase text-[10px] border-r border-teal-800 cursor-pointer hover:bg-[#002f3a]"
              >
                % Gasto
              </th>

              <th
                onClick={() => handleSort('cumPct')}
                className="py-2.5 px-2 text-right font-black uppercase text-[10px] border-r border-teal-800 cursor-pointer hover:bg-[#002f3a] text-purple-300"
              >
                Pareto Acum.
              </th>

              <th
                onClick={() => handleSort('recetas')}
                className="py-2.5 px-2.5 text-right font-black uppercase text-[10px] cursor-pointer hover:bg-[#002f3a] text-sky-300"
              >
                Recetas
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                  No se encontraron medicamentos para los filtros activos
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => (
                <tr
                  key={`${item.idSuministro}-${item.nombreCompleto}-${item.tipoSuministro}`}
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-750 ${
                    item.isPareto80 ? 'bg-purple-50/20 dark:bg-purple-950/10' : idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/60 dark:bg-slate-800/60'
                  }`}
                >
                  <td className="py-2 px-3.5 font-bold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      {item.isPareto80 && (
                        <span title="Producto dentro del 80% del gasto (Pareto)" className="text-purple-600 dark:text-purple-400">
                          ⚡
                        </span>
                      )}
                      <span className="truncate block max-w-[240px]" title={item.nombreCompleto}>
                        {item.nombre}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal block truncate">
                      {item.concentracion !== '—' ? item.concentracion : ''}
                    </span>
                  </td>

                  <td className="py-2 px-2 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/60 text-[11px]">
                    <span className="truncate block max-w-[90px]">{item.forma}</span>
                  </td>

                  <td className="py-2 px-2 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/60 text-[10px]">
                    <span className="truncate block max-w-[120px]">{item.tipoSuministro}</span>
                  </td>

                  <td className="py-2 px-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/60 font-semibold">
                    {formatNumber(item.cantidad)}
                  </td>

                  <td className="py-2 px-2.5 text-right tabular-nums text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700/60">
                    {formatCurrency(item.costoUnitarioPromedio)}
                  </td>

                  <td className="py-2 px-2.5 text-right tabular-nums font-black text-amber-700 dark:text-amber-300 border-r border-slate-100 dark:border-slate-700/60 bg-amber-50/30 dark:bg-amber-950/20">
                    {formatCurrency(item.costoTotal)}
                  </td>

                  <td className="py-2 px-2 text-right tabular-nums text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700/60 font-bold">
                    {item.porcentajeGasto}%
                  </td>

                  <td className="py-2 px-2 text-right tabular-nums border-r border-slate-100 dark:border-slate-700/60">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.isPareto80 ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' : 'text-slate-400'
                    }`}>
                      {item.cumPct}%
                    </span>
                  </td>

                  <td className="py-2 px-2.5 text-right tabular-nums font-bold text-sky-700 dark:text-sky-300">
                    {formatNumber(item.recetas)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
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
