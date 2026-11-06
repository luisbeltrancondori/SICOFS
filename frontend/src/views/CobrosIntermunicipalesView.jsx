import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  HandCoins,
  LoaderCircle,
  Printer,
  RefreshCw,
} from 'lucide-react';
import logoMontero from '../assets/logo-montero.jpg';
import logoSus from '../assets/logo-sus.png';

const YEARS = ['2023', '2024', '2025', '2026'];
const QUARTERS = [
  ['todos', 'Todos los trimestres'],
  ['1', 'Primer Trimestre (Ene-Mar)'],
  ['2', 'Segundo Trimestre (Abr-Jun)'],
  ['3', 'Tercer Trimestre (Jul-Sep)'],
  ['4', 'Cuarto Trimestre (Oct-Dic)'],
];

const INITIAL_FILTERS = {
  gestion: '2026',
  trimestre: 'todos',
  idMunOri: 'all',
  idEstablecimiento: 'all',
};

async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (fetchError) {
    if (fetchError.name === 'AbortError') throw fetchError;
    throw new Error('No se pudo conectar con el servidor. Verifique que la API SICOFS esté disponible.');
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new Error(`El servidor no respondió un JSON válido (HTTP ${response.status}). Verifique la ruta de la API y que el backend esté activo.`);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`La API devolvió una respuesta JSON inesperada (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(data.error || `La API respondió con el estado HTTP ${response.status}.`);
  }
  return data;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getExportRows(rows) {
  return rows.map((row) => [
    row.Municipio_Deudor,
    row.Cantidad_Total,
    row.Costo_Total_General,
  ]);
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export default function CobrosIntermunicipalesView() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [municipios, setMunicipios] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [rows, setRows] = useState([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingMunicipios(true);
    setCatalogError('');
    const params = new URLSearchParams({
      gestion: filters.gestion,
      trimestre: filters.trimestre,
    });

    const loadMunicipios = async () => {
      try {
        const data = await fetchJson(
          `/api/reportes/cobros-intermunicipales/filtros?${params.toString()}`,
          { signal: controller.signal },
        );
        const movements = (data.movimientos || []).filter(
          (movement) => String(movement.Id_MunOri) !== '71001',
        );
        const availableMunicipalities = new Map();
        const availableFacilities = new Map();

        movements.forEach((movement) => {
          const municipalityId = String(movement.Id_MunOri);
          const facilityId = String(movement.Id_Establecimiento);
          if (
            filters.idEstablecimiento === 'all'
            || facilityId === filters.idEstablecimiento
          ) {
            availableMunicipalities.set(municipalityId, {
              Id_MunOri: movement.Id_MunOri,
              Des_Municipio: movement.Des_MunOri,
            });
          }
          if (filters.idMunOri === 'all' || municipalityId === filters.idMunOri) {
            availableFacilities.set(facilityId, {
              Id_Establecimiento: movement.Id_Establecimiento,
              Des_Establecimiento: String(movement.Des_Establecimiento || '').trim(),
            });
          }
        });

        setMunicipios([...availableMunicipalities.values()]);
        setEstablecimientos(
          [...availableFacilities.values()].sort((a, b) =>
            a.Des_Establecimiento.localeCompare(b.Des_Establecimiento, 'es'),
          ),
        );
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setMunicipios([]);
          setEstablecimientos([]);
          setCatalogError(fetchError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingMunicipios(false);
      }
    };

    loadMunicipios();

    return () => controller.abort();
  }, [filters.gestion, filters.trimestre, filters.idMunOri, filters.idEstablecimiento]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      gestion: filters.gestion,
      trimestre: filters.trimestre,
    });
    if (filters.idMunOri !== 'all') params.set('idMunOri', filters.idMunOri);
    if (filters.idEstablecimiento !== 'all') {
      params.set('idEstablecimiento', filters.idEstablecimiento);
    }

    setLoading(true);
    setError('');
    const loadReport = async () => {
      try {
        const data = await fetchJson(
          `/api/reportes/cobros-intermunicipales?${params.toString()}`,
          { signal: controller.signal },
        );
        setRows(data.rows || []);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setRows([]);
          setError(fetchError.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadReport();

    return () => controller.abort();
  }, [filters]);

  const totalCosto = useMemo(
    () => rows.reduce((total, row) => total + (Number(row.Costo_Total_General) || 0), 0),
    [rows],
  );
  const totalCantidad = useMemo(
    () => rows.reduce((total, row) => total + (Number(row.Cantidad_Total) || 0), 0),
    [rows],
  );

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(['gestion', 'trimestre'].includes(key)
        ? { idMunOri: 'all', idEstablecimiento: 'all' }
        : {}),
    }));
  };

  const exportCsv = () => {
    const headers = [
      'Gestión',
      'Trimestre',
      'Establecimiento de atención',
      'Municipio deudor',
      'Cantidad total',
      'Costo total general (Bs.)',
    ];
    const content = [
      headers,
      ...getExportRows(rows),
      ['TOTAL GENERAL', totalCantidad, totalCosto],
    ]
      .map((line) => line.map(escapeCsv).join(';'))
      .join('\r\n');
    downloadFile(
      new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' }),
      `SICOFS_cobros_intermunicipales_${filters.gestion}.csv`,
    );
  };

  const exportExcel = async () => {
    setExportingExcel(true);
    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Cobros intermunicipales');
      sheet.columns = [
        { header: 'Municipio deudor', key: 'municipio', width: 26 },
        { header: 'Cantidad total', key: 'cantidad', width: 18 },
        { header: 'Costo total general (Bs.)', key: 'costo', width: 26 },
      ];
      rows.forEach((row) => {
        sheet.addRow({
          municipio: row.Municipio_Deudor,
          cantidad: Number(row.Cantidad_Total) || 0,
          costo: Number(row.Costo_Total_General) || 0,
        });
      });
      sheet.addRow({
        municipio: 'TOTAL GENERAL',
        cantidad: totalCantidad,
        costo: totalCosto,
      });
      const header = sheet.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF045D6E' } };
      const totalRow = sheet.getRow(sheet.rowCount);
      totalRow.font = { bold: true };
      totalRow.border = { top: { style: 'thin', color: { argb: 'FF0F766E' } } };
      sheet.getColumn('costo').numFmt = '"Bs." #,##0.00';
      sheet.getColumn('cantidad').numFmt = '#,##0.##';

      const buffer = await workbook.xlsx.writeBuffer();
      downloadFile(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `SICOFS_cobros_intermunicipales_${filters.gestion}.xlsx`,
      );
    } catch (exportError) {
      setError(`No fue posible exportar a Excel: ${exportError.message}`);
    } finally {
      setExportingExcel(false);
    }
  };

  const resetFilters = () => setFilters(INITIAL_FILTERS);

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 transition-colors dark:bg-slate-900 sm:px-6">
      <div className="mx-auto max-w-screen-2xl">
        <header className="relative mb-5 overflow-hidden rounded-2xl border border-teal-700/40 bg-gradient-to-r from-[#003844] via-[#045d6e] to-[#013543] text-white shadow-xl shadow-teal-950/20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-10 [background-size:16px_16px]" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-4 px-5 py-4 lg:flex-row">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 items-center justify-center rounded-xl border border-white/30 bg-white p-1.5 shadow-md">
                <img src={logoMontero} alt="Gobierno Autónomo Municipal de Montero" className="h-full w-auto max-w-[190px] object-contain" />
              </div>
              <div className="hidden border-l border-white/20 pl-3.5 text-left sm:block">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-300">Santa Cruz • Bolivia</span>
                <h2 className="text-sm font-extrabold uppercase leading-tight">Secretaría Municipal de Salud</h2>
                <p className="text-[11px] font-medium text-teal-200/90">Instancia Técnica de Salud</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="rounded-full border border-teal-500/30 bg-teal-900/70 px-3.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-teal-200">
                Sistema SICOFS • Reporte financiero
              </span>
              <h1 className="mt-1 text-xl font-black tracking-tight md:text-2xl">COBROS INTERMUNICIPALES</h1>
              <p className="text-xs font-medium text-teal-100/80">Atenciones y suministros por municipio deudor</p>
            </div>

            <div className="flex items-center gap-2">
              <img src={logoSus} alt="Sistema Único de Salud" className="hidden h-12 w-auto rounded-xl bg-white p-1.5 sm:block" />
              <div className="no-print flex items-center gap-1 rounded-xl border border-white/10 bg-black/25 p-1">
                <button type="button" onClick={exportCsv} disabled={loading || rows.length === 0} title="Exportar CSV" className="rounded-lg p-2 text-teal-100 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <Download className="h-4 w-4" />
                </button>
                <button type="button" onClick={exportExcel} disabled={loading || exportingExcel || rows.length === 0} title="Exportar Excel" className="rounded-lg p-2 text-teal-100 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                  {exportingExcel ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => window.print()} title="Imprimir informe / Guardar PDF" className="rounded-lg p-2 text-teal-100 transition-colors hover:bg-white/15 hover:text-white">
                  <Printer className="h-4 w-4" />
                </button>
                <button type="button" onClick={resetFilters} title="Restablecer filtros" className="rounded-lg p-2 text-teal-100 transition-colors hover:bg-white/15 hover:text-white">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="no-print mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="mb-1 flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-sky-500" />Gestión</span>
              <select value={filters.gestion} onChange={(event) => handleFilterChange('gestion', event.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
                {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="mb-1 flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-teal-500" />Trimestre</span>
              <select value={filters.trimestre} onChange={(event) => handleFilterChange('trimestre', event.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
                {QUARTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="mb-1 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-indigo-500" />Municipio deudor externo</span>
              <select value={filters.idMunOri} onChange={(event) => handleFilterChange('idMunOri', event.target.value)} disabled={loadingMunicipios} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
                <option value="all">{loadingMunicipios ? 'Cargando municipios...' : 'Todos los municipios'}</option>
                {municipios.map((municipio) => (
                  <option key={municipio.Id_MunOri} value={municipio.Id_MunOri}>{municipio.Des_Municipio}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="mb-1 flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-teal-600" />Establecimiento de atención</span>
              <select value={filters.idEstablecimiento} onChange={(event) => handleFilterChange('idEstablecimiento', event.target.value)} disabled={loadingMunicipios} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
                <option value="all">{loadingMunicipios ? 'Cargando establecimientos...' : 'Todos los establecimientos de Montero'}</option>
                {establecimientos.map((establecimiento) => (
                  <option key={establecimiento.Id_Establecimiento} value={establecimiento.Id_Establecimiento}>
                    {establecimiento.Des_Establecimiento}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {(catalogError || error) && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            <strong className="block">No se pudo completar la consulta</strong>
            {catalogError && <p>{catalogError}</p>}
            {error && <p>{error}</p>}
          </div>
        )}

        <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-sky-100 p-2.5 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"><HandCoins className="h-5 w-5" /></span>
              <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cantidad total</p><p className="text-2xl font-black text-slate-900 dark:text-white">{loading ? '—' : new Intl.NumberFormat('es-BO').format(totalCantidad)}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-white to-teal-50 p-5 shadow-sm dark:border-teal-900 dark:from-slate-800 dark:to-teal-950/30">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"><CircleDollarSign className="h-5 w-5" /></span>
              <div><p className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">Costo global acumulado</p><p className="text-2xl font-black text-slate-900 dark:text-white">{loading ? '—' : formatCurrency(totalCosto)}</p></div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Cobros intermunicipales por GAM deudor</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Gestión {filters.gestion} · agregados por municipio de origen externo · excluye Montero (ID 71001)</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{loading ? 'Consultando...' : `${rows.length} registros`}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Municipio Deudor (GAM)</th>
                  <th className="px-5 py-3 text-right font-bold">Cantidad total</th>
                  <th className="px-5 py-3 text-right font-bold">Costo total (Bs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan="3" className="px-5 py-14 text-center text-slate-500"><span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />Consultando las bases históricas SICOFS...</span></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="3" className="px-5 py-14 text-center text-slate-500 dark:text-slate-400">No se encontraron cobros para los filtros seleccionados.</td></tr>
                ) : rows.map((row, index) => (
                  <tr key={`${row.Id_Municipio_Deudor}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.Municipio_Deudor}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{new Intl.NumberFormat('es-BO').format(Number(row.Cantidad_Total) || 0)}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(row.Costo_Total_General)}</td>
                  </tr>
                ))}
              </tbody>
              {!loading && rows.length > 0 && (
                <tfoot className="border-t-2 border-teal-200 bg-teal-50/70 font-bold text-slate-900 dark:border-teal-900 dark:bg-teal-950/30 dark:text-white">
                  <tr>
                    <td className="px-5 py-3 text-right">TOTAL GENERAL</td>
                    <td className="px-5 py-3 text-right tabular-nums">{new Intl.NumberFormat('es-BO').format(totalCantidad)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(totalCosto)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row dark:border-slate-800">
          <span>Fuente oficial: Sistema SICOFS • Vistas v_movserim y v_movsumim</span>
          <span>Secretaría Municipal de Salud de Montero</span>
        </footer>
      </div>
    </div>
  );
}
