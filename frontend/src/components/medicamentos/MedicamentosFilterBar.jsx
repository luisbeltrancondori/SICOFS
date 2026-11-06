import React from 'react';
import { Calendar, ChevronDown, Layers, Building2, Pill, Search, RotateCcw, Filter } from 'lucide-react';

const MONTHS = [
  { value: 'all', label: 'Todas' },
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

export default function MedicamentosFilterBar({
  filters,
  filterOptions,
  onFilterChange,
  onReset,
}) {
  const years = filterOptions?.years || [2023, 2024, 2025, 2026];
  const tipos = filterOptions?.tipos || ['Todas'];
  const establecimientos = filterOptions?.establecimientos || [];

  const activeCount = [
    filters.mes !== 'all',
    filters.tipo !== 'all' && filters.tipo !== 'Todas',
    filters.establecimiento !== 'all',
    Boolean(filters.medicamento && filters.medicamento.trim()),
  ].filter(Boolean).length;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-4 mb-5 transition-all">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* 1. Gestión */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>Gestión</span>
          </label>
          <div className="relative">
            <select
              value={filters.year}
              onChange={(e) => onFilterChange('year', e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all cursor-pointer shadow-xs"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Mes */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-teal-500" />
            <span>Mes</span>
          </label>
          <div className="relative">
            <select
              value={filters.mes}
              onChange={(e) => onFilterChange('mes', e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all cursor-pointer shadow-xs"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. Grupo de Medicamento / Tipo de Suministro */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Grupo Medicamento</span>
          </label>
          <div className="relative">
            <select
              value={filters.tipo}
              onChange={(e) => onFilterChange('tipo', e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all cursor-pointer truncate shadow-xs"
            >
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4. Establecimiento */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-purple-500" />
            <span>Establecimiento</span>
          </label>
          <div className="relative">
            <select
              value={filters.establecimiento}
              onChange={(e) => onFilterChange('establecimiento', e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all cursor-pointer truncate shadow-xs"
            >
              <option value="all">Todas</option>
              {establecimientos.map((e) => (
                <option key={e.Id_Establecimiento} value={e.Id_Establecimiento}>
                  {e.Des_Establecimiento}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 5. Buscar Medicamento */}
        <div className="relative">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <Search className="w-3.5 h-3.5 text-emerald-500" />
            <span>Buscar Medicamento</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej. Paracetamol, Omeprazol..."
              value={filters.medicamento}
              onChange={(e) => onFilterChange('medicamento', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all shadow-xs"
            />
            {filters.medicamento && (
              <button
                onClick={() => onFilterChange('medicamento', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Active filter counter & reset button */}
      {activeCount > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <span className="text-xs text-sky-700 dark:text-sky-300 font-semibold bg-sky-50 dark:bg-sky-950/40 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
            Filtros activos: {activeCount}
          </span>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        </div>
      )}
    </section>
  );
}
