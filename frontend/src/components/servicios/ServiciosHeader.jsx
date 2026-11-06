import React from 'react';
import { Stethoscope, HeartPulse, Printer, RefreshCw, Moon, Sun, Download, ShieldCheck } from 'lucide-react';
import logoMontero from '../../assets/logo-montero.jpg';
import logoSus from '../../assets/logo-sus.png';

export default function ServiciosHeader({ isDark, setIsDark, onPrint, onExport, onReset }) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003844] via-[#045d6e] to-[#013543] text-white shadow-xl shadow-teal-950/20 border border-teal-700/40 mb-5">
      {/* Subtle medical grid background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* ECG wave SVG in background */}
      <svg
        className="absolute right-52 top-1/2 -translate-y-1/2 h-20 w-80 opacity-20 pointer-events-none text-sky-300"
        fill="none"
        viewBox="0 0 500 100"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M0,50 L120,50 L135,30 L150,75 L165,15 L180,85 L195,50 L280,50 L295,20 L310,80 L325,50 L500,50" />
      </svg>

      <div className="relative z-10 px-6 py-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Left: Official Municipal Montero Logo & Department Title */}
          <div className="flex items-center gap-3.5">
            <div className="bg-white rounded-xl p-1.5 shadow-md border border-white/30 flex items-center justify-center h-14 sm:h-16 transition-transform hover:scale-[1.02]">
              <img
                src={logoMontero}
                alt="Gobierno Autónomo Municipal Montero"
                className="h-full w-auto object-contain max-w-[210px] sm:max-w-[240px]"
              />
            </div>

            <div className="hidden sm:block text-left border-l border-white/20 pl-3.5">
              <span className="text-[10px] font-bold tracking-widest text-teal-300 uppercase block">
                Santa Cruz • Bolivia
              </span>
              <h2 className="text-sm font-extrabold tracking-tight text-white leading-tight uppercase">
                Secretaría Municipal de Salud
              </h2>
              <p className="text-[11px] text-teal-200/90 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300 inline" /> Instancia Técnica de Salud
              </p>
            </div>
          </div>

          {/* Center Title (Official Report Header as in Power BI) */}
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-200 bg-teal-900/70 px-3.5 py-0.5 rounded-full border border-teal-500/30">
              SISTEMA SICOFS • GESTIÓN DE PRODUCCIÓN EN SALUD
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
              REPORTE DE SERVICIOS OTORGADOS
            </h1>
            <p className="text-xs text-teal-100/80 font-medium">
              Reporte de servicios otorgados por establecimiento de salud y gestión
            </p>
          </div>

          {/* Right: Slogan & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Slogan pill as in Power BI */}
            <div className="hidden xl:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15">
              <HeartPulse className="w-6 h-6 text-rose-300 animate-pulse" />
              <div className="text-left">
                <p className="text-xs font-black italic text-white leading-tight">Más salud,</p>
                <p className="text-[11px] text-teal-200 italic font-medium leading-tight">mejor calidad de vida</p>
              </div>
            </div>

            {/* SUS Logo */}
            <div className="bg-white rounded-xl p-1.5 shadow-md border border-white/30 flex items-center justify-center h-14 w-auto">
              <img
                src={logoSus}
                alt="SUS"
                className="h-full w-auto object-contain max-w-[130px]"
              />
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/10 no-print">
              <button
                onClick={onPrint}
                title="Imprimir informe / Guardar PDF"
                className="p-2 rounded-lg hover:bg-white/15 text-teal-100 hover:text-white transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onExport}
                title="Exportar a CSV"
                className="p-2 rounded-lg hover:bg-white/15 text-teal-100 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onReset}
                title="Restablecer filtros"
                className="p-2 rounded-lg hover:bg-white/15 text-teal-100 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                title={isDark ? "Modo claro" : "Modo oscuro"}
                className="p-2 rounded-lg hover:bg-white/15 text-teal-100 hover:text-white transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-200" />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
