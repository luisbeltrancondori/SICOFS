import React from 'react';
import { X, FileSpreadsheet, FileText, Printer } from 'lucide-react';

// data = { kpis, monthlyData, topEstablecimientos, genderData }
// filters = { year, mes, sexo, establecimiento }
export default function ExportModal({ data, filters, onClose }) {
  const handleDownloadCsv = () => {
    const rows = [
      ['Establecimiento', 'Nivel', 'Pacientes', 'Atenciones'],
      ...(data.topEstablecimientos || []).map(e => [
        `"${e.nombre}"`, e.nivel, e.pacientes, e.atenciones
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SICOFS_establecimientos_${filters.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleDownloadJson = () => {
    const payload = {
      generado: new Date().toISOString(),
      filtros: filters,
      kpis: data.kpis,
      evolucionMensual: data.monthlyData,
      topEstablecimientos: data.topEstablecimientos,
      distribucionSexo: data.genderData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SICOFS_datos_${filters.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-gradient-to-r from-[#014d5e] to-[#046c82] text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold">Exportar Información</h3>
            <p className="text-xs text-teal-200">Gestión {filters.year} — seleccione formato</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition text-left group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Exportar a CSV / Excel</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tabla de establecimientos con pacientes y atenciones</p>
            </div>
          </button>

          <button
            onClick={handleDownloadJson}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition text-left group"
          >
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Exportar a JSON</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Todos los datos del dashboard en formato estructurado</p>
            </div>
          </button>

          <button
            onClick={handlePrint}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-slate-800 transition text-left group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Imprimir / PDF</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Versión optimizada para impresión institucional</p>
            </div>
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-right">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
