import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FileBarChart2,
  FileJson,
  FileSpreadsheet,
  Printer,
  ShieldAlert,
  Wallet,
} from 'lucide-react';

const REPORT_CARDS = [
  {
    id: 'monthly',
    title: 'Informe Mensual de Consolidación SICOFS',
    description: 'Atenciones, pacientes únicos, ejecución por nivel y prestaciones principales.',
    Icon: CalendarDays,
    action: 'Generar informe mensual',
  },
  {
    id: 'facility',
    title: 'Ficha Técnica por Centro de Salud',
    description: 'Resumen individual de producción y gasto del establecimiento seleccionado.',
    Icon: Building2,
    action: 'Generar ficha técnica',
  },
  {
    id: 'annual',
    title: 'Consolidado Anual para Rendición de Cuentas',
    description: 'Totales de gestión, ejecución por nivel, ranking y evolución mensual.',
    Icon: FileBarChart2,
    action: 'Generar consolidado anual',
  },
];

const MONTHS = [
  { id: 1, label: 'Enero' }, { id: 2, label: 'Febrero' }, { id: 3, label: 'Marzo' },
  { id: 4, label: 'Abril' }, { id: 5, label: 'Mayo' }, { id: 6, label: 'Junio' },
  { id: 7, label: 'Julio' }, { id: 8, label: 'Agosto' }, { id: 9, label: 'Septiembre' },
  { id: 10, label: 'Octubre' }, { id: 11, label: 'Noviembre' }, { id: 12, label: 'Diciembre' },
];

const FORMATTERS = {
  number: new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }),
  money: new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};

function formatNumber(value) {
  return FORMATTERS.number.format(Number(value) || 0);
}

function formatMoney(value) {
  return `Bs. ${FORMATTERS.money.format(Number(value) || 0)}`;
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadFile(filename, content, mimeType) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map((row) => headers.map((key) => csvCell(row[key])))]
    .map((line) => line.join(';'))
    .join('\r\n');
  downloadFile(filename, `\uFEFF${csv}`, 'text/csv;charset=utf-8;');
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {children}
      </select>
    </label>
  );
}

export default function ReportesDashboard() {
  const [options, setOptions] = useState({ years: [2023, 2024, 2025, 2026], groups: [], establishments: [] });
  const [filters, setFilters] = useState({
    year: '2025',
    month: String(new Date().getMonth() + 1),
    facility: 'all',
    group: 'all',
    service: '',
    fromDate: '',
    toDate: '',
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    fetch('/api/reportes/filters')
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No se pudieron cargar los filtros.');
        setOptions(payload);
      })
      .catch((error) => setReportError(error.message));
  }, []);

  const selectedFacility = useMemo(
    () => options.establishments.find((item) => String(item.Id_Establecimiento) === filters.facility),
    [filters.facility, options.establishments]
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setExportMessage('');
  };

  const buildParams = (sourceFilters, {
    includeFacility = true,
    includeMonth = true,
    includeGroup = true,
    includeDateRange = true,
  } = {}) => {
    const params = new URLSearchParams({ year: sourceFilters.year });
    if (includeMonth && sourceFilters.month !== 'all') params.set('month', sourceFilters.month);
    if (includeFacility && sourceFilters.facility !== 'all') params.set('facility', sourceFilters.facility);
    if (includeGroup && sourceFilters.group !== 'all') params.set('group', sourceFilters.group);
    if (includeDateRange && sourceFilters.service.trim()) params.set('service', sourceFilters.service.trim());
    if (includeDateRange && sourceFilters.fromDate) params.set('fromDate', sourceFilters.fromDate);
    if (includeDateRange && sourceFilters.toDate) params.set('toDate', sourceFilters.toDate);
    return params;
  };

  const generateReport = async (report) => {
    if (report.id === 'facility' && filters.facility === 'all') {
      setReportError('Selecciona un establecimiento para generar su ficha técnica.');
      setSelectedReport(report);
      setPreview(null);
      return;
    }
    if (report.id === 'monthly' && filters.month === 'all') {
      setReportError('Selecciona un mes para generar el informe mensual.');
      setSelectedReport(report);
      setPreview(null);
      return;
    }

    setSelectedReport(report);
    setReportLoading(true);
    setReportError('');
    setPreview(null);
    try {
      const params = buildParams(filters, {
        includeFacility: report.id === 'facility' || filters.facility !== 'all',
        includeMonth: report.id !== 'annual',
        includeGroup: false,
        includeDateRange: false,
      });
      const response = await fetch(`/api/reportes/executive?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No fue posible generar el informe.');
      setPreview(payload);
    } catch (error) {
      setReportError(error.message);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchDataset = async (datasetFilters) => {
    const params = buildParams(datasetFilters);
    params.set('limit', '50000');
    const response = await fetch(`/api/reportes/dataset?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'No fue posible preparar el dataset.');
    return payload;
  };

  const exportDataset = async (format) => {
    setExportLoading(true);
    setExportError('');
    setExportMessage('');
    try {
      const dataset = await fetchDataset(filters);
      if (!dataset.rows.length) {
        setExportMessage('No hay registros que coincidan con los filtros seleccionados.');
        return;
      }
      if (format === 'json') {
        downloadFile(
          `SICOFS_dataset_${filters.year}.json`,
          JSON.stringify(dataset, null, 2),
          'application/json;charset=utf-8;'
        );
      } else {
        downloadCsv(dataset.rows, `SICOFS_matriz_${filters.year}.csv`);
      }
      setExportMessage(
        dataset.truncated
          ? `Descarga preparada con ${formatNumber(dataset.rows.length)} de ${formatNumber(dataset.totalRows)} filas agregadas; aplica filtros para obtener el resto.`
          : `${formatNumber(dataset.rows.length)} filas agregadas exportadas.`
      );
    } catch (error) {
      setExportError(error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const downloadOpenDataset = async () => {
    setExportLoading(true);
    setExportError('');
    setExportMessage('');
    try {
      const openFilters = {
        ...filters,
        month: 'all',
        facility: 'all',
        group: 'all',
        service: '',
        fromDate: '',
        toDate: '',
      };
      const dataset = await fetchDataset(openFilters);
      if (!dataset.rows.length) {
        setExportMessage('No hay datos disponibles para esta gestión.');
        return;
      }
      downloadFile(
        `SICOFS_dataset_abierto_${filters.year}.json`,
        JSON.stringify(dataset, null, 2),
        'application/json;charset=utf-8;'
      );
      setExportMessage(
        dataset.truncated
          ? `Dataset abierto: ${formatNumber(dataset.rows.length)} de ${formatNumber(dataset.totalRows)} filas. Filtra por grupo o establecimiento para completar la revisión.`
          : `Dataset abierto preparado: ${formatNumber(dataset.rows.length)} filas agregadas.`
      );
    } catch (error) {
      setExportError(error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const printReport = () => {
    document.body.classList.add('reports-printing');
    const cleanup = () => document.body.classList.remove('reports-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  };

  const monthLabel = MONTHS.find((item) => String(item.id) === String(preview?.filters.month))?.label;
  const reportTitle = selectedReport?.title || 'Informe ejecutivo SICOFS';
  const allDemandServices = (preview?.topServices || []).filter((item) => /laboratorio|urgencia|emergencia/i.test(item.servicio || ''));

  return (
    <div className="reportes-view min-h-screen w-full bg-slate-50 px-3 py-5 transition-colors dark:bg-slate-900 sm:px-5 xl:px-8">
      <style>{`
        @media print {
          body.reports-printing * { visibility: hidden !important; }
          body.reports-printing .report-print-content,
          body.reports-printing .report-print-content * { visibility: visible !important; }
          body.reports-printing .report-print-content {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            padding: 24px !important;
            color: #0f172a !important;
            background: white !important;
          }
          body.reports-printing .report-print-hide { display: none !important; }
          body.reports-printing .report-print-content table { width: 100% !important; border-collapse: collapse !important; }
          body.reports-printing .report-print-content th,
          body.reports-printing .report-print-content td { border: 1px solid #cbd5e1 !important; padding: 6px !important; color: #0f172a !important; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-[#003844] via-[#045d6e] to-[#013543] p-5 text-white shadow-lg sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3 text-teal-200"><ClipboardList className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">SICOFS · Gestión municipal de salud</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Centro de Reportes</h1>
                <p className="mt-1 max-w-3xl text-sm text-teal-50/80">Informes ejecutivos, control financiero y exportación de datos agregados para gestión y rendición de cuentas.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 md:self-center">
              <CheckCircle2 className="h-4 w-4" /> Fuente: consolidado histórico SICOFS
            </div>
          </div>
        </header>

        <section aria-labelledby="executive-reports-heading">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">01 · Informes oficiales</p>
            <h2 id="executive-reports-heading" className="mt-1 text-lg font-extrabold text-slate-800 dark:text-white">Reportes ejecutivos e imprimibles</h2>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-3">
            <SelectField label="Gestión" value={filters.year} onChange={(value) => updateFilter('year', value)}>
              {options.years.map((year) => <option key={year} value={year}>{year}</option>)}
            </SelectField>
            <SelectField label="Mes del informe" value={filters.month} onChange={(value) => updateFilter('month', value)}>
              <option value="all">Todos los meses</option>
              {MONTHS.map((month) => <option key={month.id} value={month.id}>{month.label}</option>)}
            </SelectField>
            <SelectField label="Establecimiento" value={filters.facility} onChange={(value) => updateFilter('facility', value)}>
              <option value="all">Red municipal completa</option>
              {options.establishments.map((facility) => (
                <option key={facility.Id_Establecimiento} value={facility.Id_Establecimiento}>{facility.Des_Establecimiento}</option>
              ))}
            </SelectField>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {REPORT_CARDS.map(({ id, title, description, Icon, action }) => (
              <article key={id} className={`flex min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-800 ${
                selectedReport?.id === id ? 'border-sky-500 ring-2 ring-sky-500/20 dark:border-sky-400' : 'border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold leading-5 text-slate-800 dark:text-white">{title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <span className="text-[11px] text-slate-400">
                    {id === 'facility' ? (selectedFacility?.Des_Establecimiento || 'Selecciona un centro') : `Gestión ${filters.year}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => generateReport(REPORT_CARDS.find((item) => item.id === id))}
                    disabled={reportLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#007eaa] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#006b91] disabled:cursor-wait disabled:opacity-60"
                  >
                    {id === 'annual' ? <Printer className="h-4 w-4" /> : <FileBarChart2 className="h-4 w-4" />}
                    {reportLoading && selectedReport?.id === id ? 'Generando…' : action}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {reportError && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {reportError}
            </div>
          )}

          {reportLoading && (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
              Consultando consolidado histórico para preparar el informe…
            </div>
          )}

          {preview && selectedReport && (
            <section className="report-print-content mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="report-print-hide flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-850">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">Vista previa · {preview.scope}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-slate-800 dark:text-white">{reportTitle}</h3>
                </div>
                <button type="button" onClick={printReport} className="inline-flex items-center gap-2 rounded-xl bg-[#003844] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#045d6e]">
                  <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
                </button>
              </div>
              <div className="p-5 sm:p-7">
                <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">Gobierno Autónomo Municipal de Montero · Secretaría Municipal de Salud</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">{reportTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {preview.scope} · Gestión {preview.filters.year}
                    {preview.filters.month ? ` · ${monthLabel}` : ' · Consolidado anual'}
                    {selectedFacility && selectedReport.id === 'facility' ? ` · ${selectedFacility.Des_Establecimiento}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Generado: {new Date(preview.generatedAt).toLocaleString('es-BO')}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ['Atenciones registradas', formatNumber(preview.kpis.atenciones)],
                    ['Pacientes únicos', formatNumber(preview.kpis.pacientesUnicos)],
                    ['Servicios otorgados', formatNumber(preview.kpis.servicios)],
                    ['Costo ejecutado', formatMoney(preview.kpis.costoEjecutado)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="mt-1 text-lg font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="min-w-0">
                    <h3 className="mb-2 text-sm font-extrabold text-slate-800 dark:text-white">Ejecución por nivel de atención</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[480px] text-left text-xs">
                        <thead className="bg-[#003844] text-white">
                          <tr><th className="px-3 py-2.5">Nivel</th><th className="px-3 py-2.5 text-right">Atenciones</th><th className="px-3 py-2.5 text-right">Servicios</th><th className="px-3 py-2.5 text-right">Costo ejecutado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {preview.byLevel.map((row) => (
                            <tr key={row.nivel}>
                              <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100">{row.nivel}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.atenciones)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.servicios)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(row.costoEjecutado)}</td>
                            </tr>
                          ))}
                          {!preview.byLevel.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">Sin registros para los criterios seleccionados.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-2 text-sm font-extrabold text-slate-800 dark:text-white">Prestaciones principales por cantidad</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[420px] text-left text-xs">
                        <thead className="bg-[#003844] text-white">
                          <tr><th className="px-3 py-2.5">Prestación</th><th className="px-3 py-2.5 text-right">Cantidad</th><th className="px-3 py-2.5 text-right">Costo ejecutado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {preview.topServices.map((row) => (
                            <tr key={row.servicio}>
                              <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">{row.servicio}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.cantidad)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(row.costoEjecutado)}</td>
                            </tr>
                          ))}
                          {!preview.topServices.length && <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">Sin prestaciones para los criterios seleccionados.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {selectedReport.id === 'annual' && (
                  <div className="mt-6">
                    <h3 className="mb-2 text-sm font-extrabold text-slate-800 dark:text-white">Resumen mensual de la gestión</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left text-xs">
                        <thead className="bg-[#003844] text-white">
                          <tr><th className="px-3 py-2.5">Mes</th><th className="px-3 py-2.5 text-right">Atenciones</th><th className="px-3 py-2.5 text-right">Servicios</th><th className="px-3 py-2.5 text-right">Costo ejecutado</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {preview.monthly.map((row) => (
                            <tr key={row.mes}>
                              <td className="px-3 py-2.5 font-semibold">{MONTHS.find((month) => month.id === row.mes)?.label || row.mes}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.atenciones)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(row.servicios)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(row.costoEjecutado)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <p className="mt-5 border-t border-slate-200 pt-3 text-[11px] text-slate-400 dark:border-slate-700">
                  Fuente: BDTemporal.v_Consolidado_SICOFS_Historico · El reporte de servicios médicos utiliza registros del grupo T.
                </p>
              </div>
            </section>
          )}
        </section>

        <section aria-labelledby="financial-monitoring-heading">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">02 · Monitoreo gerencial</p>
            <h2 id="financial-monitoring-heading" className="mt-1 text-lg font-extrabold text-slate-800 dark:text-white">Control y monitoreo financiero</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><Wallet className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Desviación presupuestaria</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">El gasto ejecutado puede consultarse por servicio y nivel en los informes. La desviación requiere contrastarlo con presupuesto aprobado por partida.</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">
                <div className="flex items-center gap-2 font-bold"><ShieldAlert className="h-4 w-4 shrink-0" /> Comparación proyectado vs. real no disponible</div>
                <p className="mt-1 text-xs leading-5">La fuente actual no incluye presupuesto planificado ni código de partida. Para habilitar la auditoría se requiere incorporar la tabla oficial de presupuesto aprobado y su clave de vinculación con servicio/partida.</p>
              </div>
              {preview && (
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                  Ejecución real del informe visible: <strong className="tabular-nums">{formatMoney(preview.kpis.costoEjecutado)}</strong>
                </p>
              )}
            </article>

            <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-rose-50 p-2.5 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><AlertTriangle className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Capacidad instalada vs. demanda</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">La demanda observada puede identificarse; no se calcula saturación sin capacidad oficial disponible.</p>
                </div>
              </div>
              {preview && allDemandServices.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[360px] text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                      <tr><th className="px-3 py-2">Servicio crítico detectado</th><th className="px-3 py-2 text-right">Demanda (cantidad)</th><th className="px-3 py-2 text-right">Capacidad</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {allDemandServices.map((row) => (
                        <tr key={row.servicio}>
                          <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">{row.servicio}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatNumber(row.cantidad)}</td>
                          <td className="px-3 py-2 text-right text-amber-700 dark:text-amber-300">Sin dato</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-[11px] text-slate-400">Demanda del corte de informe; porcentaje de saturación pendiente de turnos, cupos, equipos o personal habilitado.</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Genera un informe para revisar la demanda observada de laboratorio o urgencias. La fuente de capacidad instalada todavía no está integrada.
                </div>
              )}
            </article>
          </div>
        </section>

        <section aria-labelledby="advanced-export-heading">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">03 · Datos para análisis</p>
            <h2 id="advanced-export-heading" className="mt-1 text-lg font-extrabold text-slate-800 dark:text-white">Exportación avanzada</h2>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Personaliza el corte. La salida se agrega por gestión, mes, centro, grupo y servicio; no contiene identificadores ni datos personales de pacientes.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SelectField label="Grupo de datos" value={filters.group} onChange={(value) => updateFilter('group', value)}>
                {(options.groups || []).map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}
              </SelectField>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Servicio contiene</span>
                <input value={filters.service} onChange={(event) => updateFilter('service', event.target.value)} maxLength={120} placeholder="Ej. laboratorio, consulta..." className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Desde</span>
                <input type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hasta</span>
                <input type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={exportLoading} onClick={() => exportDataset('csv')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
                <FileSpreadsheet className="h-4 w-4" /> {exportLoading ? 'Preparando…' : 'Descargar CSV / Excel'}
              </button>
              <button type="button" disabled={exportLoading} onClick={() => exportDataset('json')} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <FileJson className="h-4 w-4" /> Descargar JSON
              </button>
              <button type="button" disabled={exportLoading} onClick={downloadOpenDataset} className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-60 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                <ArrowDownToLine className="h-4 w-4" /> Dataset abierto · gestión completa
              </button>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-400">
              <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Excel abre directamente el CSV. Por descarga se entregan hasta 50.000 filas agregadas; si se alcanza el límite, filtra el conjunto y descarga los cortes restantes.
            </p>
            {exportError && <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{exportError}</div>}
            {exportMessage && <div role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{exportMessage}</div>}
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <span>SICOFS · Reportes ejecutivos y administrativos · Montero</span>
          <span>Soluciones informaticas LBC</span>
        </footer>
      </div>
    </div>
  );
}
