import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ClipboardList,
  Download,
  Layers,
  Loader2,
  Search,
  SlidersHorizontal,
  Stethoscope,
  X,
} from 'lucide-react';

const PAGE_SIZE = 25;
const ALL = 'Todos';
const CURRENCY_FORMAT = '"Bs. " #,##0.00';

const FILTERS = [
  { key: 'idServicioPub', label: 'N° Publicación' },
  { key: 'grupoServicio', label: 'Grupo de servicio' },
  { key: 'tipoServicio', label: 'Tipo de servicio' },
  { key: 'grupoProcedimiento', label: 'Grupo de procedimiento' },
  { key: 'nivelHabilitado', label: 'Nivel habilitado' },
];

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Bs. 0,00';
  return `Bs. ${amount.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      response.status === 404
        ? 'No se encontró la API de Servicios SUS. Reinicie el backend para cargar la nueva ruta.'
        : `La API devolvió una respuesta inesperada (HTTP ${response.status}). Verifique que el backend esté activo.`
    );
  }

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'No fue posible consultar el catálogo de servicios.');
  }
  return payload;
}

export default function ServiciosSUSView() {
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({
    tiposServicio: 0,
    gruposProcedimiento: 0,
    gruposServicio: 0,
  });
  const [filterOptions, setFilterOptions] = useState({});
  const [latestPublication, setLatestPublication] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(FILTERS.map(({ key }) => [key, ALL]))
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilterOptions() {
      try {
        const response = await fetch('/api/servicios-sus/filters', { signal: controller.signal });
        const payload = await readJsonResponse(response);
        const options = payload.options || {};
        setFilterOptions(options);
        const latest = payload.latestPublication;
        if (latest != null) {
          setLatestPublication(latest);
          setFilters((previous) => previous.idServicioPub === ALL
            ? { ...previous, idServicioPub: String(latest) }
            : previous);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error al cargar los filtros de Servicios SUS:', err);
          setError(err.message || 'Error al conectar con el catálogo de Servicios SUS.');
        }
      }
    }

    loadFilterOptions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (search.trim()) params.set('q', search.trim());
        FILTERS.forEach(({ key }) => {
          if (filters[key] !== ALL) params.set(key, filters[key]);
        });

        const response = await fetch(`/api/servicios-sus?${params}`, {
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);
        if (!Array.isArray(payload.rows)) {
          throw new Error('La respuesta del catálogo de Servicios SUS no tiene el formato esperado.');
        }
        setRows(payload.rows);
        setTotalRows(Number(payload.total) || 0);
        setCategoryTotals({
          tiposServicio: Number(payload.totalTiposServicio) || 0,
          gruposProcedimiento: Number(payload.totalGruposProcedimiento) || 0,
          gruposServicio: Number(payload.totalGruposServicio) || 0,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error al cargar el catálogo de Servicios SUS:', err);
          setError(err.message || 'Error al conectar con el catálogo de Servicios SUS.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [page, search, filters]);

  const publicationCount = filters.idServicioPub === ALL ? null : totalRows;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const visibleRows = rows;

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const changeFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const resetFilters = () => {
    setSearch('');
    setFilters(Object.fromEntries(FILTERS.map(({ key }) => [key, key === 'idServicioPub' && latestPublication != null ? String(latestPublication) : ALL])));
  };

  const exportExcel = async () => {
    if (exporting || totalRows === 0) return;
    setExporting(true);
    setError('');

    try {
      const params = new URLSearchParams({ all: 'true' });
      if (search.trim()) params.set('q', search.trim());
      FILTERS.forEach(({ key }) => {
        if (filters[key] !== ALL) params.set(key, filters[key]);
      });
      const response = await fetch(`/api/servicios-sus?${params}`);
      const payload = await readJsonResponse(response);
      if (!Array.isArray(payload.rows)) {
        throw new Error('La respuesta del catálogo de Servicios SUS no tiene el formato esperado.');
      }
      const exportRows = payload.rows;
      if (exportRows.length === 0) return;

      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SICOFS';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Catálogo Servicios SUS', {
        views: [{ state: 'frozen', ySplit: 3 }],
      });
      sheet.mergeCells(1, 1, 1, 8);
      sheet.getCell('A1').value = 'GOBIERNO AUTÓNOMO MUNICIPAL DE MONTERO - SECRETARÍA MUNICIPAL DE SALUD / SUS';
      sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      sheet.getCell('A1').alignment = { horizontal: 'center' };
      sheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003844' },
      };
      sheet.mergeCells(2, 1, 2, 8);
      sheet.getCell('A2').value = `Catálogo de servicios · ${exportRows.length} registros`;
      sheet.getCell('A2').font = { italic: true, color: { argb: 'FF475569' } };

      const headers = [
        'Código',
        'Descripción',
        'Costo',
        'Grupo Servicio',
        'Tipo Servicio',
        'Grupo Procedimiento',
        'Nivel Habilitado',
        'N° Publicación',
      ];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0E7490' },
      };
      sheet.addRows(exportRows.map((row) => [
        row.codigo ?? '',
        row.descripcion ?? '',
        Number(row.costo) || 0,
        row.grupoServicio ?? '',
        row.tipoServicio ?? '',
        row.grupoProcedimiento ?? '',
        row.nivelHabilitado ?? '',
        row.idServicioPub ?? '',
      ]));
      sheet.getColumn(3).numFmt = CURRENCY_FORMAT;
      sheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: sheet.rowCount, column: headers.length },
      };
      sheet.columns.forEach((column, index) => {
        const maxLength = column.values.reduce(
          (max, value) => Math.max(max, String(value ?? '').length),
          String(headers[index] || '').length
        );
        column.width = Math.min(Math.max(maxLength + 2, 12), 60);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'catalogo_servicios_sus.xlsx';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Error al exportar el catálogo de Servicios SUS:', err);
      setError('No se pudo generar el Excel. Intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-5 dark:bg-slate-900 sm:px-6">
      <div className="mx-auto max-w-screen-2xl space-y-5">
        <header className="rounded-2xl bg-gradient-to-r from-[#003844] to-sky-800 p-5 text-white shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">
                  Catálogo institucional
                </p>
                <h1 className="mt-1 text-xl font-black sm:text-2xl">Servicios SUS</h1>
                <p className="mt-1 text-xs text-sky-100">
                  Servicios habilitados registrados en BDCatalogos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={exportExcel}
              disabled={loading || exporting || totalRows === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-sky-900 shadow-sm transition hover:bg-sky-50 disabled:cursor-wait disabled:opacity-60"
            >
              {exporting
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {exporting ? 'Generando Excel...' : 'Exportar Excel'}
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
              <SlidersHorizontal className="h-4 w-4 text-sky-600" />
              Buscador y filtros
            </h2>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Buscar por código o descripción
              </span>
              <span className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ej. código o nombre del servicio"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </span>
            </label>
            {FILTERS.map(({ key, label }) => (
              <label key={key}>
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {label}
                </span>
                <select
                  value={filters[key]}
                  onChange={(event) => changeFilter(key, event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value={ALL}>{ALL}</option>
                  {filterOptions[key]?.map((value) => (
                    <option key={String(value)} value={String(value)}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Servicios encontrados</p>
            <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
              {loading ? '—' : totalRows.toLocaleString('es-BO')}
            </p>
            <p className="mt-1 text-xs text-slate-400">Coinciden con la búsqueda y los filtros</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tipos de servicio</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-black text-sky-700 dark:text-sky-300">
              <Stethoscope className="h-5 w-5" />
              {loading ? '—' : categoryTotals.tiposServicio.toLocaleString('es-BO')}
            </p>
            <p className="mt-1 text-xs text-slate-400">Tipos distintos en los resultados filtrados</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Grupos de procedimiento</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-black text-violet-700 dark:text-violet-300">
              <Activity className="h-5 w-5" />
              {loading ? '—' : categoryTotals.gruposProcedimiento.toLocaleString('es-BO')}
            </p>
            <p className="mt-1 text-xs text-slate-400">Grupos distintos en los resultados filtrados</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Grupos de servicio</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">
              <Layers className="h-5 w-5" />
              {loading ? '—' : categoryTotals.gruposServicio.toLocaleString('es-BO')}
            </p>
            <p className="mt-1 text-xs text-slate-400">Grupos distintos en los resultados filtrados</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Catálogo de servicios</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {loading ? 'Cargando catálogo...' : `${totalRows.toLocaleString('es-BO')} registros`}
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
              Consultando servicios habilitados...
            </div>
          ) : (
            <>
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-[#003844] text-white">
                    <tr>
                      {['Código', 'Descripción', 'Costo', 'Grupo Servicio', 'Tipo Servicio', 'Grupo Procedimiento', 'Nivel Habilitado', 'N° Publicación'].map((heading) => (
                        <th key={heading} className="px-3 py-3 font-bold uppercase tracking-wide">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {visibleRows.map((row, index) => (
                      <tr key={`${row.idServicioPub}-${row.codigo}-${index}`} className="hover:bg-sky-50/70 dark:hover:bg-slate-700/50">
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{row.codigo ?? '—'}</td>
                        <td className="min-w-[260px] px-3 py-2.5 text-slate-700 dark:text-slate-200">{row.descripcion ?? '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-200">{formatCurrency(row.costo)}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.grupoServicio ?? '—'}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.tipoServicio ?? '—'}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.grupoProcedimiento ?? '—'}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.nivelHabilitado ?? '—'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-600 dark:text-slate-300">{row.idServicioPub ?? '—'}</td>
                      </tr>
                    ))}
                    {visibleRows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-12 text-center text-sm text-slate-500">
                          No hay servicios que coincidan con la búsqueda y los filtros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <span>
                  Página {page} de {totalPages} · {visibleRows.length} de {totalRows.toLocaleString('es-BO')} servicios
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
