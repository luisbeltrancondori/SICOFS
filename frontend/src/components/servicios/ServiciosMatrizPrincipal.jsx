import React, { useMemo, useState } from 'react';
import { Activity, Download, Search, Wallet } from 'lucide-react';

const MONTHS = [
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-BO');
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function ServiciosMatrizPrincipal({ data, selectedMonth }) {
  const [activeTab, setActiveTab] = useState('cantidad');
  const [searchTerm, setSearchTerm] = useState('');
  const isFinancial = activeTab === 'costos';

  const rows = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    return (data || [])
      .filter((item) => !query || [
        item.nombre,
        item.tipoServicio,
        item.grupoProcedimiento,
      ].some((value) => value?.toLocaleLowerCase().includes(query)))
      .map((item) => {
        const totalCantidad = MONTHS.reduce(
          (sum, month) => sum + (Number(item.meses?.[month.id]?.cantidad) || 0),
          0
        );
        const totalCosto = MONTHS.reduce(
          (sum, month) => sum + (Number(item.meses?.[month.id]?.costo) || 0),
          0
        );
        return { ...item, totalCantidad, totalCosto };
      })
      .sort((a, b) => isFinancial ? b.totalCosto - a.totalCosto : b.totalCantidad - a.totalCantidad);
  }, [data, isFinancial, searchTerm]);

  const totals = useMemo(() => MONTHS.reduce((acc, month) => {
    acc[month.id] = rows.reduce((sum, item) => (
      sum + (Number(item.meses?.[month.id]?.[isFinancial ? 'costo' : 'cantidad']) || 0)
    ), 0);
    return acc;
  }, {}), [rows, isFinancial]);

  const grandTotal = rows.reduce(
    (sum, item) => sum + (isFinancial ? item.totalCosto : item.totalCantidad),
    0
  );

  const exportCsv = () => {
    const headers = [
      'Nombre Servicio',
      ...MONTHS.map(({ label }) => isFinancial ? `${label} (Bs.)` : label),
      isFinancial ? 'Total Bs.' : 'Total Cantidad',
    ];
    const csvRows = rows.map((item) => [
      csvCell(item.nombre),
      ...MONTHS.map(({ id }) => Number(item.meses?.[id]?.[isFinancial ? 'costo' : 'cantidad']) || 0),
      isFinancial ? item.totalCosto : item.totalCantidad,
    ]);
    const csv = [headers, ...csvRows].map((line) => line.join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matriz_servicios_${isFinancial ? 'financiera' : 'cantidades'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'cantidad', label: 'Matriz de Volumen y Cantidades', Icon: Activity },
    { id: 'costos', label: 'Matriz Financiera y Costos (Bs.)', Icon: Wallet },
  ];

  return (
    <section className="w-full min-w-0 mb-5">
      <nav aria-label="Tipo de matriz de servicios" className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(id)}
              className={`flex min-h-14 items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                active
                  ? 'border-sky-700 bg-[#003844] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-sky-300' : 'text-sky-600 dark:text-sky-400'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div role="tabpanel" className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
        <header className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-850 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              {isFinancial ? 'Matriz Financiera y Costos (Bs.)' : 'Matriz de Volumen y Cantidades'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {rows.length} de {(data || []).length} servicios
              {selectedMonth && selectedMonth !== 'all' ? ' · mes filtrado' : ' · gestión completa'}
              {' · '}las 12 columnas mensuales permanecen visibles
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <label className="relative min-w-0 flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar servicio..."
                aria-label="Buscar servicio en la matriz"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!rows.length}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Exportar CSV compatible con Excel"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </header>

        <div className="max-h-[min(68vh,720px)] w-full overflow-auto">
          <table className="w-full min-w-[1220px] border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-[#003844] text-white">
              <tr>
                <th scope="col" className="sticky left-0 z-30 min-w-[270px] border-r border-teal-800 bg-[#003844] px-4 py-3 text-left font-bold">
                  Nombre Servicio
                </th>
                {MONTHS.map(({ id, label }) => (
                  <th key={id} scope="col" className="min-w-[78px] border-r border-teal-800/70 px-2 py-3 text-right font-bold">
                    {isFinancial ? `${label} (Bs.)` : label}
                  </th>
                ))}
                <th scope="col" className="sticky right-0 z-30 min-w-[145px] bg-[#025669] px-3 py-3 text-right font-black text-amber-200">
                  {isFinancial ? 'Total Bs.' : 'Total Cantidad'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
              {rows.length ? rows.map((item, index) => (
                <tr key={`${item.nombre}-${item.tipoServicio}-${item.grupoProcedimiento}`} className="group">
                  <th scope="row" title={item.nombre} className={`sticky left-0 z-10 min-w-[270px] border-r border-slate-200 px-4 py-2.5 text-left font-semibold text-slate-800 group-hover:bg-sky-50 dark:border-slate-700 dark:text-slate-100 dark:group-hover:bg-slate-700 ${
                    index % 2 ? 'bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-800'
                  }`}>
                    <span className="block max-w-[380px] whitespace-normal">{item.nombre}</span>
                  </th>
                  {MONTHS.map(({ id }) => {
                    const value = Number(item.meses?.[id]?.[isFinancial ? 'costo' : 'cantidad']) || 0;
                    return (
                      <td key={id} className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-slate-700 group-hover:bg-sky-50 dark:text-slate-300 dark:group-hover:bg-slate-700">
                        {isFinancial ? formatCurrency(value) : formatNumber(value)}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 whitespace-nowrap bg-sky-50 px-3 py-2.5 text-right font-black tabular-nums text-sky-800 group-hover:bg-sky-100 dark:bg-slate-700 dark:text-sky-200 dark:group-hover:bg-slate-600">
                    {isFinancial ? formatCurrency(item.totalCosto) : formatNumber(item.totalCantidad)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={14} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron servicios para la búsqueda y los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-20 bg-[#003844] font-black text-white">
                <tr>
                  <th scope="row" className="sticky left-0 z-30 border-r border-teal-800 bg-[#003844] px-4 py-3 text-left uppercase tracking-wide">
                    Total
                  </th>
                  {MONTHS.map(({ id }) => (
                    <td key={id} className="whitespace-nowrap px-2 py-3 text-right tabular-nums text-amber-200">
                      {isFinancial ? formatCurrency(totals[id]) : formatNumber(totals[id])}
                    </td>
                  ))}
                  <td className="sticky right-0 z-30 whitespace-nowrap bg-[#002f3a] px-3 py-3 text-right tabular-nums text-emerald-300">
                    {isFinancial ? formatCurrency(grandTotal) : formatNumber(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="flex flex-col gap-1 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-700/70 sm:flex-row sm:items-center sm:justify-between">
          <span>{isFinancial ? 'Importes expresados en bolivianos (Bs.).' : 'Cantidades según servicios otorgados registrados.'} Desplaza horizontalmente para consultar todos los meses.</span>
          <span>Filas visibles: {rows.length}</span>
        </div>
      </div>
    </section>
  );
}
