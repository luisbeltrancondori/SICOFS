import React from 'react';
import { Filter, RotateCcw, Download, ChevronDown, CheckCircle2 } from 'lucide-react';

const YEARS = ['2023', '2024', '2025', '2026'];

const MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export default function FilterBar({ filters, establecimientos, onFilterChange, onExport }) {
  const activeCount = [
    filters.mes !== 'all',
    filters.sexo !== 'all',
    filters.establecimiento !== 'all',
  ].filter(Boolean).length;

  const handleReset = () => {
    onFilterChange('mes', 'all');
    onFilterChange('sexo', 'all');
    onFilterChange('establecimiento', 'all');
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-4 mb-6 transition-all">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Filter controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">

          {/* Gestión */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Gestión:
            </label>
            <div className="relative">
              <select
                value={filters.year}
                onChange={(e) => onFilterChange('year', e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all cursor-pointer shadow-xs"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mes */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Mes:
            </label>
            <div className="relative">
              <select
                value={filters.mes}
                onChange={(e) => onFilterChange('mes', e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="all">Todos los meses</option>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sexo */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Sexo:
            </label>
            <div className="relative">
              <select
                value={filters.sexo}
                onChange={(e) => onFilterChange('sexo', e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="all">Ambos sexos</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Establecimiento */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Establecimiento:
            </label>
            <div className="relative">
              <select
                value={filters.establecimiento}
                onChange={(e) => onFilterChange('establecimiento', e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all cursor-pointer truncate shadow-xs"
              >
                <option value="all">Todos los establecimientos</option>
                {establecimientos.map(e => (
                  <option key={e.Id_Establecimiento} value={e.Id_Establecimiento}>
                    {e.Des_Establecimiento}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-end xl:self-center pt-1 xl:pt-4">
          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/40 transition-colors shadow-xs"
              title="Limpiar filtros activos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar ({activeCount})</span>
            </button>
          )}

          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/40 transition-colors shadow-xs"
            title="Exportar datos"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exportar</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Datos en tiempo real</span>
          </div>
        </div>
      </div>
    </section>
  );
}
