import React from 'react';
import { Stethoscope, Users, Building2, ShieldCheck, ArrowRight, Activity, Calendar, Pill, BarChart3, Receipt } from 'lucide-react';
import logoMontero from '../assets/logo-montero.jpg';
import logoSus from '../assets/logo-sus.png';
import VisitCounter from '../components/VisitCounter';

export default function InicioView({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#003844] via-[#045d6e] to-[#013543] text-white p-8 sm:p-12 shadow-2xl border border-teal-700/40 mb-8">
          <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/15">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-2xl p-2 shadow-lg h-16 w-auto flex items-center justify-center">
                <img src={logoMontero} alt="GAMM" className="h-full w-auto object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-300 block">
                  GOBIERNO AUTÓNOMO MUNICIPAL DE MONTERO
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  SECRETARÍA MUNICIPAL DE SALUD
                </h1>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-2 shadow-lg h-16 w-auto flex items-center justify-center">
              <img src={logoSus} alt="SUS" className="h-full w-auto object-contain max-w-[130px]" />
            </div>
          </div>

          <div className="mt-6 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-200 border border-sky-400/30 mb-3">
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              SISTEMA DE CONTROL FINANCIERO DE SALUD (SICOFS)
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Portal de Vigilancia y Producción Hospitalaria de Montero
            </h2>
            <p className="mt-3 text-sm text-teal-100/90 leading-relaxed">
              Consolidado oficial de información en salud para la toma de decisiones estratégicas en los 12 establecimientos de la Red Municipal de Salud de Montero.
            </p>
          </div>
        </div>

        {/* Module Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
          {/* Card 1: Servicios */}
          <div
            onClick={() => onNavigate('servicios')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-125" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white shadow-md shadow-sky-500/20">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Módulo Oficial
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Servicios Otorgados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Producción de servicios clínicos, procedimientos, diagnósticos y costos en los centros de salud.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
              <span>Ingresar a Servicios</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Pacientes */}
          <div
            onClick={() => onNavigate('pacientes')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-125" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Módulo Oficial
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Pacientes Atendidos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Cobertura poblacional, evolución mensual de pacientes únicos, distribución por sexo y ranking.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
              <span>Ingresar a Pacientes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Medicamentos */}
          <div
            onClick={() => onNavigate('medicamentos')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-125" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                  <Pill className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Módulo Oficial
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Medicamentos e Insumos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Dispensación farmacéutica, matrices mensuales de costos y cantidades, recetas y análisis Pareto 80/20.
              </p>
            </div>

            <div
              className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400"
            >
              <span>Ingresar a Medicamentos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Producción */}
          <div
            onClick={() => onNavigate('produccion')}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-125" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  Módulo Oficial
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Producción Económica
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Reporte resumido de servicios y suministros otorgados por establecimientos de salud, evolución mensual y comparativo interanual.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
              <span>Ingresar a Producción</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>

          {/* Card 5: Cobros Intermunicipales */}
          <a
            href="/cobros-intermunicipales"
            onClick={(event) => {
              event.preventDefault();
              onNavigate('cobros-intermunicipales');
            }}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-125" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600 shadow-md shadow-blue-500/10">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  MÓDULO OFICIAL
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Cobros Intermunicipales
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Gestión de matrices de costos, servicios y medicamentos generados a pacientes de otros municipios.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Ingresar a Cobros</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </a>
        </div>

        <div className="mb-6 flex justify-end">
          <VisitCounter />
        </div>

        {/* Network Info Pills */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase block">Red de Salud</span>
            <span className="text-base font-black text-slate-800 dark:text-white">12 Establecimientos</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase block">Cobertura</span>
            <span className="text-base font-black text-slate-800 dark:text-white">1er y 2do Nivel</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase block">Gestiones Históricas</span>
            <span className="text-base font-black text-slate-800 dark:text-white">2023 - 2026</span>
          </div>
          
        </div>
        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <span>SICOFS · Reportes ejecutivos y administrativos · Montero</span>
          <span>Soluciones informaticas LBC - Cel.: 62108877</span>
        </footer>
      </div>
    </div>
  );
}
