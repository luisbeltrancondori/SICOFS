import React, { useState, useEffect, useCallback } from 'react';
import MedicamentosHeader from '../components/medicamentos/MedicamentosHeader';
import MedicamentosFilterBar from '../components/medicamentos/MedicamentosFilterBar';
import MedicamentosKpiCards from '../components/medicamentos/MedicamentosKpiCards';
import MedicamentosRankings from '../components/medicamentos/MedicamentosRankings';
import MedicamentosEvolucion from '../components/medicamentos/MedicamentosEvolucion';
import MedicamentosDistribucion from '../components/medicamentos/MedicamentosDistribucion';
import MedicamentosMatrizCantidad from '../components/medicamentos/MedicamentosMatrizCantidad';
import MedicamentosMatrizCosto from '../components/medicamentos/MedicamentosMatrizCosto';
import MedicamentosTablaDetalle from '../components/medicamentos/MedicamentosTablaDetalle';
import { Calendar, Database, ShieldAlert, Sparkles, Layers } from 'lucide-react';

const DEFAULT_FILTERS = {
  year: '2026',
  mes: 'all',
  tipo: 'all',
  establecimiento: 'all',
  medicamento: '',
};

export default function MedicamentosDashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState(null);

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

  // Tab for switching between Table 1 (Cantidad) and Table 2 (Costo)
  const [activeTableTab, setActiveTableTab] = useState('costo'); // 'costo' | 'cantidad' | 'ambas'

  // Load filter options on mount
  useEffect(() => {
    fetch('/api/medicamentos/filters')
      .then((r) => r.json())
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.error('Error loading filter options:', err));
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback((signal) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('year', filters.year);
    if (filters.mes !== 'all') params.set('mes', filters.mes);
    if (filters.tipo !== 'all' && filters.tipo !== 'Todas') params.set('tipo', filters.tipo);
    if (filters.establecimiento !== 'all') {
      params.set('id_establecimiento', filters.establecimiento);
    }
    if (filters.medicamento && filters.medicamento.trim()) params.set('medicamento', filters.medicamento.trim());

    fetch(`/api/medicamentos/dashboard-all?${params.toString()}`, { signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError('Error al conectar con la base de datos de medicamentos.');
        setLoading(false);
        console.error(err);
      });
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [fetchDashboardData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors py-4 px-3 sm:px-6">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <MedicamentosHeader
          isDark={isDark}
          setIsDark={setIsDark}
          onPrint={() => window.print()}
          onExport={() => {
            const tableElem = document.querySelector('table');
            if (tableElem) window.print();
          }}
          onReset={handleResetFilters}
        />

        {/* Global Filters */}
        <MedicamentosFilterBar
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Error Banner */}
        {error && (
          <div className="my-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error de conexión</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-700 dark:text-slate-200 text-sm font-bold">
                Consultando dispensación de medicamentos e insumos...
              </p>
              <p className="text-slate-400 text-xs">
                Extrayendo registros de SICOFS-SERVER\SUS • Farmacia Municipal
              </p>
            </div>
          </div>
        )}

        {!loading && dashboardData && (
          <>
            {/* Row 1: Executive KPI Cards + Special Prescription KPI */}
            <MedicamentosKpiCards
              kpis={dashboardData.kpis}
              filters={filters}
            />

            {/* Row 2: Top Rankings (Cost vs Quantity) */}
            <MedicamentosRankings
              data={dashboardData.topMedicamentosDetalle}
              rankingCosto={dashboardData.rankingCosto}
              rankingCantidad={dashboardData.rankingCantidad}
              onSelectMedicine={(medName) => handleFilterChange('medicamento', medName)}
            />

            {/* Row 3: Monthly Evolution (Expenditure & Units) */}
            <MedicamentosEvolucion
              data={dashboardData.monthlyData}
              selectedMonth={filters.mes}
              onSelectMonth={(m) => handleFilterChange('mes', m)}
            />

            {/* Row 4: Distributions (Group Donut & Establishment Ranking) */}
            <MedicamentosDistribucion
              distribucionGrupo={dashboardData.distribucionGrupo}
              distribucionEstablecimiento={dashboardData.distribucionEstablecimiento}
              onSelectEstablishment={(idEst) => handleFilterChange('establecimiento', idEst)}
              onSelectGroup={(grp) => handleFilterChange('tipo', grp)}
            />

            {/* Tab Selector for Matrices (Tabla 1 vs Tabla 2) */}
            <div className="flex items-center justify-between mb-3 mt-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Visualización de Matrices:
                </span>
                <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    onClick={() => setActiveTableTab('costo')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeTableTab === 'costo'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Tabla 2: Matriz de Costos (Bs.)
                  </button>
                  <button
                    onClick={() => setActiveTableTab('cantidad')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeTableTab === 'cantidad'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Tabla 1: Matriz de Cantidades (Unidades)
                  </button>
                  <button
                    onClick={() => setActiveTableTab('ambas')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeTableTab === 'ambas'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Ver Ambas Matrices
                  </button>
                </div>
              </div>
            </div>

            {/* Mandatory Table 2: Cost Matrix */}
            {(activeTableTab === 'costo' || activeTableTab === 'ambas') && (
              <MedicamentosMatrizCosto
                data={dashboardData.matrizMedicamentos}
                selectedMonth={filters.mes}
              />
            )}

            {/* Mandatory Table 1: Quantity Matrix */}
            {(activeTableTab === 'cantidad' || activeTableTab === 'ambas') && (
              <MedicamentosMatrizCantidad
                data={dashboardData.matrizMedicamentos}
                selectedMonth={filters.mes}
              />
            )}

            {/* Supplementary Table 3: Detalle Analítico con Pareto 80/20 */}
            <div className="mt-6">
              <MedicamentosTablaDetalle
                data={dashboardData.topMedicamentosDetalle}
                matrixData={dashboardData.matrizMedicamentos}
                selectedMonth={filters.mes}
                year={filters.year}
                totalGastoGeneral={dashboardData.kpis?.totalCosto}
              />
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Última actualización: 15/10/2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-teal-500" />
                <span>Fuente oficial: Sistema SICOFS / Farmacia Institucional Municipal  • Red de Salud Montero</span>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
