import React, { useState, useEffect, useCallback } from 'react';
import ServiciosHeader from '../components/servicios/ServiciosHeader';
import ServiciosFilterBar from '../components/servicios/ServiciosFilterBar';
import ServiciosKpiCards from '../components/servicios/ServiciosKpiCards';
import ServiciosTopEstablecimientos from '../components/servicios/ServiciosTopEstablecimientos';
import ServiciosMiddleSlicers from '../components/servicios/ServiciosMiddleSlicers';
import ServiciosNivelDonut from '../components/servicios/ServiciosNivelDonut';
import ServiciosEvolucionMensual from '../components/servicios/ServiciosEvolucionMensual';
import ServiciosCategoriasChart from '../components/servicios/ServiciosCategoriasChart';
import ServiciosVolumenTable from '../components/servicios/ServiciosVolumenTable';
import ServiciosMatrizPrincipal from '../components/servicios/ServiciosMatrizPrincipal';
import ServiciosAnaliticaEjecutiva from '../components/servicios/ServiciosAnaliticaEjecutiva';
import { Database, Calendar, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_FILTERS = {
  year: '2026',
  mes: 'all',
  tipo: 'all',
  establecimiento: 'all',
  grupoProc: 'all',
  nivel: 'all',
};

export default function ServiciosDashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState(null);
  const [showAnalyticsSection, setShowAnalyticsSection] = useState(false);

  // Dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Data state
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load filter options on mount
  useEffect(() => {
    fetch('/api/servicios/filters')
      .then((r) => r.json())
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Error loading filter options:', err));
  }, []);

  // Fetch dashboard data on filter change
  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('year', filters.year);
    if (filters.mes !== 'all') params.set('mes', filters.mes);
    if (filters.tipo !== 'all' && filters.tipo !== 'Todas') params.set('tipo', filters.tipo);
    if (filters.establecimiento !== 'all') params.set('establecimiento', filters.establecimiento);
    if (filters.grupoProc !== 'all' && filters.grupoProc !== 'Todas') params.set('grupo', filters.grupoProc);
    if (filters.nivel !== 'all' && filters.nivel !== 'Todos') params.set('nivel', filters.nivel);

    fetch(`/api/servicios/dashboard-all?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error al conectar con la base de datos de servicios.');
        setLoading(false);
        console.error(err);
      });
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 px-3 py-4 transition-colors dark:bg-slate-900 sm:px-5 xl:px-7">
      <div className="mx-auto w-full max-w-none">
        {/* Header matching institutional design */}
        <ServiciosHeader
          isDark={isDark}
          setIsDark={setIsDark}
          onPrint={() => window.print()}
          onExport={() => {
            const tableElem = document.querySelector('table');
            if (tableElem) window.print();
          }}
          onReset={handleResetFilters}
        />

        {/* Top Filter Bar (Gestión, Mes, Tipo Serv, Establecimiento, Grupo Procedimiento, Nivel) */}
        <ServiciosFilterBar
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Error banner */}
        {error && (
          <div className="my-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error de conexión</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-700 dark:text-slate-200 text-sm font-bold">
                Consultando producción de servicios...
              </p>
              <p className="text-slate-400 text-xs">
                Extrayendo registros de SICOFS-SERVER\SUS
              </p>
            </div>
          </div>
        )}

        {!loading && dashboardData && (
          <>
            <ServiciosMatrizPrincipal
              data={dashboardData.tablaDetallada}
              selectedMonth={filters.mes}
            />

            <section className="mb-5">
              <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-white">
                Reportes complementarios
              </h2>
              <ServiciosAnaliticaEjecutiva
                monthlyData={dashboardData.monthlyData}
                distributionByLevel={dashboardData.distribucionNivel}
              />
            </section>

            <ServiciosKpiCards kpis={dashboardData.kpis} filters={filters} />

            <section className="mb-5">
              <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-white">
                Volumen por establecimiento y mes
              </h2>
              <ServiciosVolumenTable
                data={dashboardData.volumenPorEstablecimiento}
                error={dashboardData.volumenPorEstablecimientoError}
                selectedMonth={filters.mes}
              />
            </section>

            <section className="mb-5">
              <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-white">
                Indicadores de la red de salud
              </h2>
              <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
                <ServiciosTopEstablecimientos
                  data={dashboardData.topEstablecimientos}
                  onSelectFacility={(fac) => handleFilterChange('establecimiento', fac.Id_Establecimiento)}
                />
                <ServiciosMiddleSlicers
                  filters={filters}
                  filterOptions={filterOptions}
                  onFilterChange={handleFilterChange}
                />
                <ServiciosNivelDonut data={dashboardData.distribucionNivel} />
              </div>
            </section>

            {/* Expandable Advanced Analytics (Monthly Evolution & Category Breakdown) */}
            <div className="mb-4">
              <button
                onClick={() => setShowAnalyticsSection(!showAnalyticsSection)}
                className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Análisis Avanzado: Evolución Mensual y Categorización Clínica</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span>{showAnalyticsSection ? 'Ocultar' : 'Mostrar gráficos'}</span>
                  {showAnalyticsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showAnalyticsSection && (
                <div className="grid min-w-0 grid-cols-1 gap-4 mt-3 xl:grid-cols-2">
                  <div className="min-w-0">
                    <ServiciosEvolucionMensual
                      data={dashboardData.monthlyData}
                      selectedMonth={filters.mes}
                      onSelectMonth={(m) => handleFilterChange('mes', m)}
                    />
                  </div>
                  <div className="min-w-0">
                    <ServiciosCategoriasChart
                      serviciosPorTipo={dashboardData.serviciosPorTipo}
                      serviciosPorGrupo={dashboardData.serviciosPorGrupo}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Última actualización: 08/10/2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-teal-500" />
                <span>Fuente: Sistema de control financiero de salud (SICOFS)</span>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
