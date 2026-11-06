import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import FilterBar from '../components/FilterBar'
import KpiCards from '../components/KpiCards'
import MonthlyEvolutionChart from '../components/MonthlyEvolutionChart'
import GenderDistributionChart from '../components/GenderDistributionChart'
import TopFacilitiesChart from '../components/TopFacilitiesChart'
import FacilityDataTable from '../components/FacilityDataTable'
import FacilityModal from '../components/FacilityModal'
import AgeGroupReport from '../components/AgeGroupReport'
import ExportModal from '../components/ExportModal'
import Footer from '../components/Footer'

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const DEFAULT_FILTERS = {
  year: '2026',
  mes: 'all',
  sexo: 'all',
  establecimiento: 'all',
}

export default function PacientesDashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedMonth, setSelectedMonth] = useState(null)

  // Dark mode
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Raw data from API
  const [kpis, setKpis] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [topEstablecimientos, setTopEstablecimientos] = useState([])
  const [genderData, setGenderData] = useState([])
  const [establecimientos, setEstablecimientos] = useState([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Build query string from filters + selected month
  const buildQS = useCallback((extra = {}) => {
    const params = new URLSearchParams()
    params.set('year', filters.year)
    if (filters.mes !== 'all') params.set('mes', filters.mes)
    if (filters.sexo !== 'all') params.set('sexo', filters.sexo)
    if (filters.establecimiento !== 'all') params.set('id_establecimiento', filters.establecimiento)
    if (selectedMonth) params.set('mes', selectedMonth)
    Object.entries(extra).forEach(([k, v]) => params.set(k, v))
    return params.toString()
  }, [filters, selectedMonth])

  // Load establecimientos list when year changes
  useEffect(() => {
    fetch(`/api/filters/establecimientos?year=${filters.year}`)
      .then(r => r.json())
      .then(data => setEstablecimientos(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error loading establecimientos:', err))
  }, [filters.year])

  // Load dashboard data when filters or selectedMonth change
  useEffect(() => {
    setLoading(true)
    setError(null)

    const qs = buildQS()

    // High performance unified endpoint
    fetch(`/api/dashboard-all?${qs}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setKpis(data.kpis?.error ? null : data.kpis)
        setMonthlyData(Array.isArray(data.monthlyData) ? data.monthlyData : [])
        setTopEstablecimientos(Array.isArray(data.topEstablecimientos) ? data.topEstablecimientos : [])
        setGenderData(Array.isArray(data.genderData) ? data.genderData : [])
        setLastUpdated(new Date())
        setLoading(false)
      })
      .catch(err => {
        console.warn('Fallback to separate endpoints...', err.message)
        const monthQS = selectedMonth ? buildQS({ mes: selectedMonth }) : qs
        Promise.all([
          fetch(`/api/kpis?${qs}`).then(r => r.json()),
          fetch(`/api/evolucion-mensual?${qs}`).then(r => r.json()),
          fetch(`/api/top-establecimientos?${monthQS}&limit=10`).then(r => r.json()),
          fetch(`/api/distribucion-sexo?${qs}`).then(r => r.json()),
        ])
          .then(([kpisData, monthly, top, gender]) => {
            setKpis(kpisData.error ? null : kpisData)
            setMonthlyData(Array.isArray(monthly) ? monthly : [])
            setTopEstablecimientos(Array.isArray(top) ? top : [])
            setGenderData(Array.isArray(gender) ? gender : [])
            setLastUpdated(new Date())
            setLoading(false)
          })
          .catch(fallbackErr => {
            setError('Error al conectar con el servidor de datos. Verifique que el servidor API esté activo.')
            setLoading(false)
            console.error(fallbackErr)
          })
      })
  }, [filters, selectedMonth, buildQS])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    if (key === 'mes') setSelectedMonth(null)
  }

  const handleMonthClick = (mes) => {
    setSelectedMonth(prev => prev === mes ? null : mes)
  }

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSelectedMonth(null)
  }

  const handleFacilityClick = async (facility) => {
    try {
      const res = await fetch(`/api/detalle-establecimiento?year=${filters.year}&id_establecimiento=${facility.Id_Establecimiento}`)
      const detail = await res.json()
      setSelectedFacility({ ...facility, monthlyDetail: detail })
    } catch (e) {
      setSelectedFacility(facility)
    }
  }

  // Table data: top establishments enriched with ranking
  const tableData = topEstablecimientos.map((est, i) => ({
    rank: i + 1,
    nombre: est.nombre,
    nivel: est.nivel,
    pacientes: est.pacientes,
    atenciones: est.atenciones,
    Id_Establecimiento: est.Id_Establecimiento,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-screen-2xl mx-auto px-4 py-4">
        {/* Header with full interactive buttons */}
        <Header
          isDark={isDark}
          setIsDark={setIsDark}
          onPrint={() => window.print()}
          onExport={() => setShowExport(true)}
          onReset={handleResetFilters}
        />

        {/* Filters */}
        <FilterBar
          filters={filters}
          establecimientos={establecimientos}
          onFilterChange={handleFilterChange}
          onExport={() => setShowExport(true)}
        />

        {/* Error banner */}
        {error && (
          <div className="my-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error de conexión</p>
              <p>{error}</p>
              <p className="text-xs mt-1">Asegúrese de que el servidor API esté corriendo: <code>npm run server</code> o <code>node server/index.cjs</code></p>
            </div>
          </div>
        )}

        {/* Selected month indicator */}
        {selectedMonth && (
          <div className="my-2 flex items-center gap-2">
            <span className="text-xs text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 font-semibold flex items-center gap-1.5 shadow-xs">
              <span>📅</span>
              <span>Filtrando por mes: <strong>{MONTH_NAMES[selectedMonth - 1]} {filters.year}</strong></span>
            </span>
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              ✕ Quitar filtro de mes
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold">Consultando base de datos oficial...</p>
              <p className="text-slate-400 text-xs">Cargando indicadores y atenciones de Montero</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* KPIs */}
            <KpiCards
              kpis={kpis}
              year={filters.year}
              selectedMonth={selectedMonth}
              monthlyData={monthlyData}
            />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <div className="lg:col-span-2">
                <MonthlyEvolutionChart
                  data={monthlyData}
                  selectedMonth={selectedMonth}
                  onMonthClick={handleMonthClick}
                  year={filters.year}
                />
              </div>
              <div className="lg:col-span-1">
                <GenderDistributionChart
                  data={genderData}
                  onGenderFilter={(sex) => handleFilterChange('sexo', sex === filters.sexo ? 'all' : sex)}
                  selectedSexo={filters.sexo}
                />
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <TopFacilitiesChart
                data={topEstablecimientos}
                selectedMonth={selectedMonth}
                onFacilityClick={handleFacilityClick}
              />
              <FacilityDataTable
                data={tableData}
                selectedMonth={selectedMonth}
                onFacilityClick={handleFacilityClick}
              />
            </div>

            <AgeGroupReport
              year={filters.year}
              month={selectedMonth || filters.mes}
              sex={filters.sexo}
              establishment={filters.establecimiento}
            />
          </>
        )}
      </div>

      <Footer lastUpdated={lastUpdated} />

      {/* Modals */}
      {selectedFacility && (
        <FacilityModal
          facility={selectedFacility}
          onClose={() => setSelectedFacility(null)}
          year={filters.year}
        />
      )}
      {showExport && (
        <ExportModal
          data={{ kpis, monthlyData, topEstablecimientos, genderData }}
          filters={filters}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
