import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  HandCoins,
  LoaderCircle,
  Printer,
  RotateCcw,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import logoMontero from '../assets/logo-montero.jpg';
import logoSus from '../assets/logo-sus.png';

const INITIAL_FILTERS = {
  gestion: '2026',
  des_dep_ori: 'all',
  gam_deudor: 'all',
  trimestre: 'all',
  grp: 'all',
  estado_deuda: 'all',
};
const QUARTER_COLUMNS = [
  ['Suma_Primer_Trimestre', 'Primer trimestre'],
  ['Suma_Segundo_Trimestre', 'Segundo trimestre'],
  ['Suma_Tercer_Trimestre', 'Tercer trimestre'],
  ['Suma_Cuarto_Trimestre', 'Cuarto trimestre'],
];
const TABLE_TABS = [
  { id: 'tabla1', label: 'Tabla 1', title: 'Costo total por GAM deudor', isMoney: true },
  { id: 'tabla2', label: 'Tabla 2', title: 'Cantidad por GAM deudor', isMoney: false },
  {
    id: 'tabla3',
    label: 'Tabla 3',
    title: 'Costo por GAM deudor y tipo de ingreso',
    isMoney: true,
    includeIncomeType: true,
  },
  { id: 'tabla4', label: 'Tabla 4 · Suministros', title: 'Costo de suministros y medicamentos por GAM', isMoney: true },
  { id: 'tabla5', label: 'Tabla 5 · Servicios', title: 'Costo de servicios por GAM', isMoney: true },
];
const MONEY_FORMAT = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const CHART_MONEY_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const PIE_COLORS = [
  '#0b3a4a',
  '#0ea5e9',
  '#10b981',
  '#2563eb',
  '#14b8a6',
  '#6366f1',
  '#06b6d4',
  '#84cc16',
  '#f59e0b',
  '#8b5cf6',
];
const INTEGER_FORMAT = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 });

function formatChartCurrency(value) {
  return `Bs ${CHART_MONEY_FORMAT.format(Number(value) || 0)}`;
}

async function fetchReport(url, signal) {
  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con la API de cobros intermunicipales.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`La API no respondió JSON válido (HTTP ${response.status}).`);
  }
  if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}.`);
  return data;
}

function amount(value, isMoney) {
  const number = Number(value) || 0;
  return isMoney ? MONEY_FORMAT.format(number) : INTEGER_FORMAT.format(number);
}

function addTotals(rows) {
  return rows.reduce((totals, row) => {
    QUARTER_COLUMNS.forEach(([field]) => {
      totals[field] += Number(row[field]) || 0;
    });
    totals.Total_General += Number(row.Total_General) || 0;
    return totals;
  }, {
    Suma_Primer_Trimestre: 0,
    Suma_Segundo_Trimestre: 0,
    Suma_Tercer_Trimestre: 0,
    Suma_Cuarto_Trimestre: 0,
    Total_General: 0,
  });
}

function sortByTotalDescending(rows) {
  return [...rows].sort((left, right) => (
    (Number(right.Total_General) || 0) - (Number(left.Total_General) || 0)
    || String(left['Nombre Municipio'] || '').localeCompare(
      String(right['Nombre Municipio'] || ''),
      'es',
    )
    || String(left.Des_TipoIngreso || '').localeCompare(
      String(right.Des_TipoIngreso || ''),
      'es',
    )
  ));
}

function FilterSelect({ label, value, options, onChange, icon: Icon }) {
  return (
    <label className="block min-w-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
      <span className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-emerald-600" />
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
      >
        <option value="all">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function MatrixTable({ title, subtitle, rows, isMoney, includeIncomeType = false, icon: Icon }) {
  const totals = useMemo(() => addTotals(rows), [rows]);
  const firstColumnLabel = includeIncomeType ? 'Municipio deudor' : 'Nombre municipio';

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle} · {rows.length.toLocaleString('es-BO')} filas</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[790px] border-collapse text-sm">
          <thead className="bg-[#092a43] text-[11px] uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3 text-left">{firstColumnLabel}</th>
              {includeIncomeType && <th className="px-4 py-3 text-left">Tipo de ingreso</th>}
              {QUARTER_COLUMNS.map(([, label]) => (
                <th key={label} className="px-4 py-3 text-right">{label}</th>
              ))}
              <th className="bg-emerald-700 px-4 py-3 text-right">Total general</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? rows.map((row, index) => (
              <tr
                key={`${row['Nombre Municipio']}-${row.Des_TipoIngreso || ''}-${index}`}
                className="transition-colors hover:bg-emerald-50/50"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">{row['Nombre Municipio']}</td>
                {includeIncomeType && (
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.Des_TipoIngreso}</td>
                )}
                {QUARTER_COLUMNS.map(([field]) => (
                  <td key={field} className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                    {amount(row[field], isMoney)}
                  </td>
                ))}
                <td className="whitespace-nowrap bg-emerald-50/60 px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                  {amount(row.Total_General, isMoney)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={includeIncomeType ? 6 : 5} className="px-5 py-12 text-center text-slate-500">
                  No se encontraron datos para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t-2 border-emerald-700 bg-emerald-50 font-extrabold text-slate-900">
            <tr>
              <td colSpan={includeIncomeType ? 2 : 1} className="px-4 py-3">Total general</td>
              {QUARTER_COLUMNS.map(([field]) => (
                <td key={field} className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {amount(totals[field], isMoney)}
                </td>
              ))}
              <td className="whitespace-nowrap bg-emerald-100 px-4 py-3 text-right tabular-nums">
                {amount(totals.Total_General, isMoney)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default function CobrosExcelDashboard() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [options, setOptions] = useState({
    gestiones: [],
    departamentos: [],
    municipios: [],
    trimestres: [],
    grupos: [],
    estadosDeuda: [],
  });
  const [report, setReport] = useState(null);
  const [activeTable, setActiveTable] = useState('tabla1');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== 'all') params.set(key, value);
    });

    setLoading(true);
    setError('');
    fetchReport(`/api/cobros/reporte?${params.toString()}`, controller.signal)
      .then((data) => {
        setReport({
          ...data,
          tablaCostoTotal: sortByTotalDescending(data.tablaCostoTotal || []),
          tablaCantidad: sortByTotalDescending(data.tablaCantidad || []),
          tablaPorTipoIngreso: sortByTotalDescending(data.tablaPorTipoIngreso || []),
          tabla1: sortByTotalDescending(data.tablaCostoTotal || []),
          tabla2: sortByTotalDescending(data.tablaCantidad || []),
          tabla3: sortByTotalDescending(data.tablaPorTipoIngreso || []),
          tabla4: sortByTotalDescending(data.tabla4 || []),
          tabla5: sortByTotalDescending(data.tabla5 || []),
        });
        setOptions(data.opciones || {});
      })
      .catch((fetchError) => {
        if (fetchError.name !== 'AbortError') {
          setReport(null);
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'gestion' ? { gam_deudor: 'all' } : {}),
    }));
  };
  const resetFilters = () => setFilters(INITIAL_FILTERS);

  const exportExcel = async () => {
    if (!report) return;
    setExporting(true);
    setError('');
    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheets = [
        ['Costo por GAM', report.tabla1, false, true],
        ['Cantidad por GAM', report.tabla2, false, false],
        ['Costo por tipo', report.tabla3, true, true],
        ['Suministros', report.tabla4, false, true],
        ['Servicios', report.tabla5, false, true],
      ];

      sheets.forEach(([name, rows, includeIncomeType, isMoney]) => {
        const sheet = workbook.addWorksheet(name);
        const columns = [
          { header: 'Nombre Municipio', key: 'municipio', width: 30 },
          ...(includeIncomeType ? [{ header: 'Des_TipoIngreso', key: 'tipo', width: 28 }] : []),
          ...QUARTER_COLUMNS.map(([field, label]) => ({ header: label, key: field, width: 22 })),
          { header: 'Total general', key: 'Total_General', width: 22 },
        ];
        sheet.columns = columns;
        rows.forEach((row) => sheet.addRow({
          municipio: row['Nombre Municipio'],
          ...(includeIncomeType ? { tipo: row.Des_TipoIngreso } : {}),
          ...Object.fromEntries(QUARTER_COLUMNS.map(([field]) => [field, Number(row[field]) || 0])),
          Total_General: Number(row.Total_General) || 0,
        }));
        const totals = addTotals(rows);
        sheet.addRow({
          municipio: 'Total general',
          ...(includeIncomeType ? { tipo: '' } : {}),
          ...totals,
        });

        const header = sheet.getRow(1);
        header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF092A43' } };
        sheet.getRow(sheet.rowCount).font = { bold: true };
        QUARTER_COLUMNS.forEach(([field]) => {
          sheet.getColumn(field).numFmt = isMoney ? '"Bs." #,##0.00' : '#,##0';
        });
        sheet.getColumn('Total_General').numFmt = isMoney ? '"Bs." #,##0.00' : '#,##0';
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SICOFS_cobros_intermunicipales_${filters.gestion}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(`No fue posible exportar a Excel: ${exportError.message}`);
    } finally {
      setExporting(false);
    }
  };

  const totalCosto = useMemo(
    () => addTotals(report?.tablaCostoTotal || []).Total_General,
    [report],
  );
  const totalCantidad = useMemo(
    () => addTotals(report?.tablaCantidad || []).Total_General,
    [report],
  );

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <header className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#08263f] via-[#0b4960] to-[#087454] text-white shadow-xl">
          <div className="flex flex-col items-center justify-between gap-4 px-5 py-5 lg:flex-row">
            <div className="flex items-center gap-3">
              <img src={logoMontero} alt="Gobierno Autónomo Municipal de Montero" className="h-12 w-auto rounded-lg bg-white p-1" />
              <div className="hidden border-l border-white/30 pl-3 sm:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Santa Cruz · Bolivia</p>
                <p className="text-sm font-extrabold uppercase">Secretaría Municipal de Salud</p>
              </div>
            </div>
            <div className="text-center">
              <span className="rounded-full border border-emerald-200/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-100">
                Sistema SICOFS · Reporte financiero
              </span>
              <h1 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">COBROS INTERMUNICIPALES</h1>
              <p className="text-xs text-emerald-100/80">Matrices de costo y cantidad por GAM deudor</p>
            </div>
            <div className="flex items-center gap-2">
              <img src={logoSus} alt="Sistema Único de Salud" className="hidden h-11 w-auto rounded-lg bg-white p-1 sm:block" />
              <button type="button" onClick={exportExcel} disabled={loading || exporting || !report} className="no-print inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
                {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Excel
              </button>
              <button type="button" onClick={() => window.print()} title="Imprimir o guardar como PDF" className="no-print rounded-xl border border-white/20 bg-white/10 p-2.5 text-white hover:bg-white/20">
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <section className="no-print mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-extrabold text-slate-800">Filtros del reporte</h2>
            </div>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
              <RotateCcw className="h-3.5 w-3.5" />Restablecer
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <FilterSelect label="Gestión" icon={CalendarDays} value={filters.gestion} options={options.gestiones || []} onChange={(value) => handleFilterChange('gestion', value)} />
            <FilterSelect label="Departamento de origen" icon={Filter} value={filters.des_dep_ori} options={options.departamentos || []} onChange={(value) => handleFilterChange('des_dep_ori', value)} />
            <FilterSelect label="GAM deudor" icon={HandCoins} value={filters.gam_deudor} options={options.municipios || []} onChange={(value) => handleFilterChange('gam_deudor', value)} />
            <FilterSelect label="Trimestre" icon={CalendarDays} value={filters.trimestre} options={options.trimestres || []} onChange={(value) => handleFilterChange('trimestre', value)} />
            <FilterSelect label="Grupo (Grp)" icon={Filter} value={filters.grp} options={options.grupos || []} onChange={(value) => handleFilterChange('grp', value)} />
            <FilterSelect label="Estado de deuda" icon={CircleDollarSign} value={filters.estado_deuda} options={options.estadosDeuda || []} onChange={(value) => handleFilterChange('estado_deuda', value)} />
          </div>
        </section>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong className="block">No se pudo completar la consulta</strong>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-12 text-sm font-semibold text-slate-600">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-emerald-700" />
            Leyendo y agrupando el archivo Excel...
          </div>
        )}

        {!loading && report && (
          <>
            <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Registros filtrados</p>
                <p className="mt-1 text-xl font-black text-[#092a43]">{INTEGER_FORMAT.format(report.registrosFiltrados || 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><HandCoins className="h-4 w-4 text-emerald-700" />Cantidad total</p>
                <p className="mt-1 text-xl font-black text-[#092a43]">{INTEGER_FORMAT.format(totalCantidad)}</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-800"><CircleDollarSign className="h-4 w-4" />Costo servicios</p>
                <p className="mt-1 text-lg font-black text-[#092a43]">{MONEY_FORMAT.format(Number(report.costoServicios) || 0)}</p>
              </div>
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-white to-purple-50 p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-purple-800"><CircleDollarSign className="h-4 w-4" />Costo medicamentos (Z)</p>
                <p className="mt-1 text-lg font-black text-[#092a43]">{MONEY_FORMAT.format(Number(report.costoSuministros) || 0)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800"><CircleDollarSign className="h-4 w-4" />Costo total</p>
                <p className="mt-1 text-lg font-black text-[#092a43]">{MONEY_FORMAT.format(totalCosto)}</p>
              </div>
            </section>
            <section className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3">
                  <h2 className="font-bold text-slate-900">Costo total por departamento</h2>
                  <p className="text-xs text-slate-500">Suma de Costo_Total por departamento deudor</p>
                </div>
                {report.graficaDepartamentos?.length ? (
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={report.graficaDepartamentos}
                      margin={{ top: 8, right: 12, left: 12, bottom: 62 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        height={72}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                      />
                      <YAxis
                        width={90}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(value) => CHART_MONEY_FORMAT.format(value)}
                      />
                      <Tooltip formatter={(value) => formatChartCurrency(value)} />
                      <Bar dataKey="total" name="Costo total" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
                    No hay costos por departamento para estos filtros.
                  </div>
                )}
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3">
                  <h2 className="font-bold text-slate-900">Costo total por tipo de ingreso</h2>
                  <p className="text-xs text-slate-500">Distribución de Costo_Total por tipo de ingreso</p>
                </div>
                {report.graficaTipoIngreso?.length ? (
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Pie
                        data={report.graficaTipoIngreso}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="46%"
                        innerRadius={66}
                        outerRadius={112}
                        paddingAngle={2}
                      >
                        {report.graficaTipoIngreso.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatChartCurrency(value)} />
                      <Legend
                        verticalAlign="bottom"
                        height={48}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
                    No hay tipos de ingreso para estos filtros.
                  </div>
                )}
              </article>
            </section>
            <div className="mb-5">
              <div role="tablist" aria-label="Tablas de cobros intermunicipales" className="mb-3 flex flex-wrap gap-2">
                {TABLE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    id={`${tab.id}-tab`}
                    type="button"
                    role="tab"
                    aria-selected={activeTable === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    onClick={() => setActiveTable(tab.id)}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                      activeTable === tab.id
                        ? 'bg-[#0b3a4a] text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {TABLE_TABS.filter((tab) => tab.id === activeTable).map((tab) => (
                <div
                  key={tab.id}
                  id={`${tab.id}-panel`}
                  role="tabpanel"
                  aria-labelledby={`${tab.id}-tab`}
                >
                  <MatrixTable
                    title={`${tab.label} · ${tab.title}`}
                    subtitle={tab.isMoney ? 'Suma de Costo_Total' : 'Suma de Cantidad'}
                    rows={report[tab.id] || []}
                    isMoney={tab.isMoney}
                    includeIncomeType={tab.includeIncomeType}
                    icon={tab.isMoney ? CircleDollarSign : HandCoins}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row">
          <span>Fuente de datos: Sistema de control financiero de salud SICOFS</span>
          <span>Secretaría Municipal de Salud de Montero</span>
        </footer>
      </div>
    </div>
  );
}
