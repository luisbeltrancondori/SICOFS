import React from 'react';
import { Calendar, Layers, Building2, Search, X } from 'lucide-react';

const MONTHS = [
  { value: 'all', label: 'Todos' },
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
];

const SELECT_CLS = `w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-600
  bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
  px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 cursor-pointer
  appearance-none shadow-xs`;

function FilterGroup({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  );
}

export default function ProduccionFilterBar({ filters, filterOptions, onFilterChange, onReset, activeFiltersCount }) {
  const { years = [], grupos = [], establecimientos = [] } = filterOptions || {};

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-4 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        {/* Gestión */}
        <FilterGroup icon={Calendar} label="Gestión">
          <div className="relative">
            <select
              value={filters.year}
              onChange={e => onFilterChange('year', e.target.value)}
              className={SELECT_CLS}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </FilterGroup>

        {/* Mes */}
        <FilterGroup icon={Calendar} label="Mes">
          <select
            value={filters.mes}
            onChange={e => onFilterChange('mes', e.target.value)}
            className={SELECT_CLS}
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </FilterGroup>

        {/* Grupo */}
        <FilterGroup icon={Layers} label="Grupo">
          <select
            value={filters.grupo}
            onChange={e => onFilterChange('grupo', e.target.value)}
            className={SELECT_CLS}
          >
            {grupos.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </FilterGroup>

        {/* Establecimiento */}
        <FilterGroup icon={Building2} label="Establecimiento">
          <select
            value={filters.establecimiento}
            onChange={e => onFilterChange('establecimiento', e.target.value)}
            className={SELECT_CLS}
          >
            <option value="all">Todos los establecimientos</option>
            {establecimientos.map(e => (
              <option key={e.Id_Establecimiento} value={e.Id_Establecimiento}>
                {e.Des_Establecimiento}
              </option>
            ))}
          </select>
        </FilterGroup>

        {/* Limpiar + Active filters count */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-transparent select-none">—</label>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 whitespace-nowrap">
                {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onReset}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold
                bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400
                border border-slate-200 dark:border-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
