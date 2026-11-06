import React from 'react';
import { Stethoscope, FileSpreadsheet, ChevronDown, CheckCircle2, RotateCcw } from 'lucide-react';

export default function ServiciosMiddleSlicers({
  filters,
  filterOptions,
  onFilterChange,
}) {
  const tipos = filterOptions?.tipos || ['Todas'];
  const grupos = filterOptions?.grupos || ['Todas'];

  const selectedTipo = filters.tipo || 'all';
  const selectedGrupo = filters.grupoProc || 'all';

  return (
    <div className="flex flex-col gap-3 h-full justify-between">
      {/* Slicer 1: Des. Tipo Servicio */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between flex-1 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Des. Tipo Servicio
            </span>
          </div>
          {selectedTipo !== 'all' && selectedTipo !== 'Todas' && (
            <button
              onClick={() => onFilterChange('tipo', 'all')}
              title="Restablecer a Todas"
              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Todas</span>
            </button>
          )}
        </div>

        <div className="relative mt-1">
          <select
            value={selectedTipo}
            onChange={(e) => onFilterChange('tipo', e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all cursor-pointer truncate shadow-xs"
          >
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="mt-2 text-[10px] text-slate-400 truncate">
          {selectedTipo !== 'all' && selectedTipo !== 'Todas' ? (
            <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-sky-500" />
              Filtrado activo
            </span>
          ) : (
            <span>Todas las prestaciones</span>
          )}
        </div>
      </div>

      {/* Slicer 2: Des. Grupo Procedimiento */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between flex-1 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Des. Grupo Procedimiento
            </span>
          </div>
          {selectedGrupo !== 'all' && selectedGrupo !== 'Todas' && (
            <button
              onClick={() => onFilterChange('grupoProc', 'all')}
              title="Restablecer a Todas"
              className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Todas</span>
            </button>
          )}
        </div>

        <div className="relative mt-1">
          <select
            value={selectedGrupo}
            onChange={(e) => onFilterChange('grupoProc', e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all cursor-pointer truncate shadow-xs"
          >
            {grupos.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="mt-2 text-[10px] text-slate-400 truncate">
          {selectedGrupo !== 'all' && selectedGrupo !== 'Todas' ? (
            <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-500" />
              Filtrado activo
            </span>
          ) : (
            <span>Todos los grupos clínicos</span>
          )}
        </div>
      </div>
    </div>
  );
}
