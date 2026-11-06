import React from 'react';
import { Download, Printer, Users, Moon, Sun, RefreshCw, ShieldCheck } from 'lucide-react';
import logoMontero from '../assets/logo-montero.jpg';
import logoSus from '../assets/logo-sus.png';

export default function Header({ isDark, setIsDark, onPrint, onExport, onReset }) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003844] via-[#045d6e] to-[#013543] text-white shadow-xl shadow-teal-950/20 border border-teal-700/40 mb-6">
      {/* Decorative medical background glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Subtle ECG pulse SVG wave in background */}
      <svg
        className="absolute right-48 top-1/2 -translate-y-1/2 h-24 w-80 opacity-20 pointer-events-none text-teal-300"
        fill="none"
        viewBox="0 0 500 100"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M0,50 L120,50 L135,30 L150,75 L165,15 L180,85 L195,50 L280,50 L295,20 L310,80 L325,50 L500,50" />
      </svg>

      <div className="relative z-10 px-6 py-5">
        {/* Top bar with Official Logos and Title */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-4 border-b border-white/15">
          
          {/* Left: Official Municipal Montero Logo */}
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
              <h2 className="text-base font-extrabold tracking-tight text-white leading-tight">
                SECRETARÍA MUNICIPAL DE SALUD
              </h2>
              <p className="text-[11px] text-teal-200/90 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-300 inline" /> Instancia Técnica de Salud
              </p>
            </div>
          </div>

          {/* Center Title (Desktop banner) */}
          <div className="hidden xl:flex flex-col items-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-200/90 bg-teal-900/60 px-3 py-0.5 rounded-full border border-teal-500/30">
              SISTEMA DE GESTIÓN Y VIGILANCIA EPIDEMIOLÓGICA
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white mt-1">
              GOBIERNO AUTÓNOMO MUNICIPAL DE MONTERO
            </h1>
          </div>

          {/* Right: Official SUS Logo & Quick Action Buttons */}
          <div className="flex items-center gap-3.5">
            {/* SUS Official Logo */}
            <div className="bg-white rounded-xl p-1.5 shadow-md border border-white/30 flex items-center justify-center h-14 sm:h-16 transition-transform hover:scale-[1.02]">
              <img
                src={logoSus}
                alt="SUS - Sistema Único de Salud"
                className="h-full w-auto object-contain max-w-[160px] sm:max-w-[185px]"
              />
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/10 no-print">
              <button
                onClick={onPrint}
                title="Imprimir o Guardar como PDF"
                className="p-2 rounded-lg hover:bg-white/15 text-teal-100 hover:text-white transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onExport}
                title="Exportar datos a CSV / Excel"
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
                title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                className="p-2 rounded-lg hover:bg-white/15 text-teal-100 hover:text-white transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-200" />}
              </button>
            </div>
          </div>
        </div>

        {/* Lower Banner Pill / Card as in image */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 bg-gradient-to-r from-[#014d5e]/90 via-[#016075]/80 to-[#025163]/90 rounded-xl px-5 py-3 border border-teal-400/30 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-teal-100 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Pacientes Atendidos
                <span className="text-[11px] font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Oficial SICOFS
                </span>
              </h2>
              <p className="text-xs text-teal-100/90 font-medium">
                Reporte resumido de pacientes atendidos por establecimiento de salud y gestión
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-teal-200 font-medium bg-black/25 px-3 py-1.5 rounded-lg border border-teal-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Red de Salud Montero</span>
            <span className="text-teal-400/50">•</span>
            <span>12 Establecimientos</span>
          </div>
        </div>
      </div>
    </header>
  );
}
