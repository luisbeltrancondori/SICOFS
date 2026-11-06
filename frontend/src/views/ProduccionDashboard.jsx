import React, { useState, useEffect, useCallback } from 'react';
import ProduccionHeader from '../components/produccion/ProduccionHeader';
import ProduccionFilterBar from '../components/produccion/ProduccionFilterBar';
import ProduccionKpiCards from '../components/produccion/ProduccionKpiCards';
import ProduccionTopEstablecimientos from '../components/produccion/ProduccionTopEstablecimientos';
import ProduccionEvolucion from '../components/produccion/ProduccionEvolucion';
import ProduccionDistribucion from '../components/produccion/ProduccionDistribucion';
import ProduccionMatriz from '../components/produccion/ProduccionMatriz';
import { Calendar, Database } from 'lucide-react';

const DEFAULT_FILTERS = {
  year: '2026',
  mes: 'all',
  grupo: 'all',
  establecimiento: 'all',
};

function countActiveFilters(f) {
  let n = 0;
  if (f.mes !== 'all') n++;
  if (f.grupo !== 'all') n++;
  if (f.establecimiento !== 'all') n++;
  return n;
}

export default function ProduccionDashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Load filter options once
  useEffect(() => {
    fetch('/api/produccion/filters')
      .then(r => r.json())
      .then(opts => setFilterOptions(opts))
      .catch(err => console.error('Error loading produccion filters:', err));
  }, []);

  // Fetch dashboard data when filters change
  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('year', filters.year);
    if (filters.mes !== 'all') params.set('mes', filters.mes);
    if (filters.grupo !== 'all') params.set('grupo', filters.grupo);
    if (filters.establecimiento !== 'all') params.set('establecimiento', filters.establecimiento);

    fetch(`/api/produccion/dashboard-all?${params}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { setDashboardData(data); setLoading(false); })
      .catch(err => { setError('Error al conectar con la base de datos de producción.'); setLoading(false); });
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilterChange = (key, value) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const activeFiltersCount = countActiveFilters(filters);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors py-4 px-3 sm:px-6">
      <div className="max-w-screen-2xl mx-auto">

        {/* Header */}
        <ProduccionHeader
          isDark={isDark}
          setIsDark={setIsDark}
          onPrint={() => window.print()}
          onReset={handleReset}
        />

        {/* Filters */}
        <ProduccionFilterBar
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Error */}
        {error && (
          <div className="my-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error de conexión</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-700 dark:text-slate-200 text-sm font-bold">
                Calculando producción económica...
              </p>
              <p className="text-slate-400 text-xs">
                Consultando SICOFS-SERVER\SUS · v_Consolidado_SICOFS_Historico
              </p>
            </div>
          </div>
        )}

        {!loading && dashboardData && (
          <>
            {/* Row 1: KPI Cards */}
            <ProduccionKpiCards
              kpis={dashboardData.kpis}
              yoyData={dashboardData.yoyData}
              filters={filters}
            />

            {/* Row 2: Top Establecimientos + Evolución Mensual */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
              <div className="lg:col-span-2">
                <ProduccionTopEstablecimientos
                  data={dashboardData.topEstablecimientos}
                  totalCosto={dashboardData.kpis?.totalCosto}
                  onSelectEstablishment={id => handleFilterChange('establecimiento', id)}
                />
              </div>
              <div className="lg:col-span-3">
                <ProduccionEvolucion
                  data={dashboardData.monthlyData}
                  selectedMonth={filters.mes}
                  onSelectMonth={m => handleFilterChange('mes', m === filters.mes ? 'all' : m)}
                />
              </div>
            </div>

            {/* Row 3: Distribution charts */}
            <div className="mb-4">
              <ProduccionDistribucion
                distribucionGrupo={dashboardData.distribucionGrupo}
                distribucionNivel={dashboardData.distribucionNivel}
              />
            </div>

            {/* Row 4: Matrix Table */}
            <div className="mb-6">
              <ProduccionMatriz
                data={dashboardData.matrizEstablecimientos}
                selectedMonth={filters.mes}
              />
            </div>

            {/* Footer */}
            <footer className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Última actualización: {new Date().toLocaleDateString('es-BO')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-violet-500" />
                <span>
                  Fuente oficial: Sistema SICOFS · Red de Salud Montero
                </span>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
