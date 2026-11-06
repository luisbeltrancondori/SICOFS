import React from 'react';
import { BarChart3, Printer, RefreshCw, Moon, Sun } from 'lucide-react';
import logoMontero from '../../assets/logo-montero.jpg';
import logoSus from '../../assets/logo-sus.png';

export default function ProduccionHeader({ isDark, setIsDark, onPrint, onReset }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003844] via-[#045d6e] to-[#013543] text-white p-5 mb-4 shadow-xl border border-teal-700/30">
      <div className="absolute right-0 top-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/2 bottom-0 w-64 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Institutional Identity */}
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl p-1.5 h-14 w-auto flex items-center justify-center shadow-lg shrink-0">
            <img src={logoMontero} alt="GAMM" className="h-full w-auto object-contain" />
          </div>
          <div>
            <span className="block text-[9px] font-black uppercase tracking-widest text-teal-300 mb-0.5">
              GOBIERNO AUTÓNOMO MUNICIPAL DE MONTERO
            </span>
            <h1 className="text-sm font-black text-white leading-tight">
              SECRETARÍA MUNICIPAL DE SALUD
            </h1>
            <p className="text-[10px] text-teal-200/80 mt-0.5">INSTANCIA TÉCNICA DE SALUD</p>
          </div>
        </div>

        {/* Title Center */}
        <div className="flex-1 text-center hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 mb-1">
            <BarChart3 className="w-4 h-4 text-violet-300" />
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-200">Módulo de Producción</span>
          </div>
          <h2 className="text-lg font-black text-white tracking-tight">
            REPORTE DE PRODUCCIÓN ECONÓMICA
          </h2>
          <p className="text-[11px] text-teal-100/70 mt-0.5">
            Producción consolidada de servicios y suministros por establecimiento de salud y gestión
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <img src={logoSus} alt="SUS" className="h-10 w-auto object-contain bg-white rounded-lg p-1 hidden sm:block" />
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
            title="Cambiar tema"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
            title="Limpiar filtros"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onPrint}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile title */}
      <div className="mt-3 lg:hidden">
        <h2 className="text-base font-black text-white">REPORTE DE PRODUCCIÓN ECONÓMICA</h2>
        <p className="text-[10px] text-teal-100/70">Producción consolidada · Red Municipal de Salud de Montero</p>
      </div>
    </div>
  );
}
