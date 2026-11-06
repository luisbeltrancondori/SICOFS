import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, Eye, Users, X } from 'lucide-react'

const AGE_GROUPS = ['0', '1', '2', '3', '4', '0-4', '5-9', '10-14', '15-19', '20-39', '40-49', '50-59', '60 y más']
const ageReportCache = new Map()

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-BO')
}

function ReportChartModal({ facility, year, onClose }) {
  const chartData = AGE_GROUPS.map(group => ({
    grupo: group,
    pacientes: Number(facility.groups[group] || 0),
  }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-report-modal-title"
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-850"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex items-start justify-between bg-gradient-to-r from-[#014d5e] to-[#046c82] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/20 bg-white/15 p-2.5">
              <BarChart3 className="h-6 w-6 text-teal-200" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                Distribución etaria • Gestión {year}
              </p>
              <h2 id="age-report-modal-title" className="mt-1 text-lg font-extrabold">
                {facility.nombre}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar gráfico"
            className="rounded-lg bg-white/10 p-1.5 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-3 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Pacientes únicos por grupo de edad
          </div>
          <div className="h-[360px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 18, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" />
                <XAxis
                  dataKey="grupo"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  formatter={value => [formatNumber(value), 'Pacientes']}
                  labelFormatter={label => `Edad ${label}`}
                />
                <Bar dataKey="pacientes" name="Pacientes" fill="#0e7490" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Los grupos 0-4, 5-9, etc. son rangos; el rango 0-4 incluye también las columnas individuales 0, 1, 2, 3 y 4.
          </p>
        </div>

        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>
  )
}

export default function AgeGroupReport({ year, month, sex, establishment }) {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFacility, setSelectedFacility] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = String(year)
    const cached = ageReportCache.get(cacheKey)
    if (cached) {
      setReportData(cached)
      setError(null)
      setLoading(false)
      return () => controller.abort()
    }

    setLoading(true)
    setError(null)
    fetch(`/api/reporte-grupo-etario?year=${encodeURIComponent(year)}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(data => {
        if (!Array.isArray(data.facilities) || !Array.isArray(data.distribution)) {
          throw new Error('La respuesta del reporte no tiene el formato esperado.')
        }
        const loadedData = { ...data, year: Number(data.year ?? year) }
        ageReportCache.set(cacheKey, loadedData)
        setReportData(loadedData)
      })
      .catch(fetchError => {
        if (fetchError.name !== 'AbortError') {
          setError('No se pudo cargar el reporte de grupos etarios. Verifique la conexión con el servidor.')
          console.error('Error loading age-group report:', fetchError)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [year])

  const facilities = useMemo(() => {
    if (Number(reportData?.year ?? year) !== Number(year) || !reportData) return []
    const selectedMonth = month === 'all' ? null : Number(month)
    const selectedFacilityId = establishment === 'all' ? null : Number(establishment)
    const counts = new Map()

    reportData.distribution.forEach(row => {
      if ((row.mes == null) !== (selectedMonth === null)) return
      if (selectedMonth !== null && Number(row.mes) !== selectedMonth) return
      if (sex !== 'all' && row.sexo !== sex) return
      if (selectedFacilityId !== null && Number(row.Id_Establecimiento) !== selectedFacilityId) return

      const facilityId = Number(row.Id_Establecimiento)
      if (!counts.has(facilityId)) {
        counts.set(facilityId, Object.fromEntries(AGE_GROUPS.map(group => [group, 0])))
      }
      const facilityGroups = counts.get(facilityId)
      const patients = Number(row.pacientes || 0)
      if (AGE_GROUPS.includes(row.grupo)) facilityGroups[row.grupo] += patients
    })

    return reportData.facilities
      .filter(facility => selectedFacilityId === null || Number(facility.Id_Establecimiento) === selectedFacilityId)
      .map(facility => ({
        ...facility,
        groups: counts.get(Number(facility.Id_Establecimiento))
          || Object.fromEntries(AGE_GROUPS.map(group => [group, 0])),
      }))
  }, [reportData, year, month, sex, establishment])

  const totals = useMemo(() => Object.fromEntries(
    AGE_GROUPS.map(group => [
      group,
      facilities.reduce((sum, facility) => sum + Number(facility.groups?.[group] || 0), 0),
    ]),
  ), [facilities])

  const totalFacility = { Id_Establecimiento: 'total', nombre: 'TOTALES', groups: totals }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all dark:border-slate-700/80 dark:bg-slate-800">
      <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-850 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-teal-50 p-2 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Pacientes por grupo etario</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pacientes únicos por establecimiento • Gestión {year}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Seleccione el ícono de ojo para visualizar el gráfico.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500 dark:text-slate-400" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          Cargando distribución por edades...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
            <thead>
              <tr className="select-none bg-[#0e6378] text-white">
                <th scope="col" className="min-w-[260px] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide">
                  Establecimiento
                </th>
                {AGE_GROUPS.map(group => (
                  <th key={group} scope="col" className="min-w-[72px] px-2 py-2.5 text-center text-[11px] font-bold">
                    {group}
                  </th>
                ))}
                <th scope="col" className="w-14 px-2 py-2.5 text-center text-[11px] font-bold">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-700">
              {facilities.map((facility, index) => (
                <tr
                  key={facility.Id_Establecimiento}
                  className={index % 2 === 0
                    ? 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    : 'bg-slate-50/70 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200'}
                >
                  <th scope="row" className="px-3 py-2.5 text-left font-semibold">{facility.nombre}</th>
                  {AGE_GROUPS.map(group => (
                    <td key={group} className="px-2 py-2.5 text-center tabular-nums">
                      {formatNumber(facility.groups?.[group])}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedFacility(facility)}
                      aria-label={`Ver gráfico de ${facility.nombre}`}
                      title={`Ver gráfico de ${facility.nombre}`}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-slate-700 dark:hover:text-teal-300"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0e6378] text-xs font-extrabold text-white">
                <th scope="row" className="px-3 py-2.5 text-left uppercase tracking-wider">TOTALES</th>
                {AGE_GROUPS.map(group => (
                  <td key={group} className="bg-[#0b5163] px-2 py-2.5 text-center tabular-nums text-amber-300">
                    {formatNumber(totals[group])}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedFacility(totalFacility)}
                    aria-label="Ver gráfico de totales"
                    title="Ver gráfico consolidado"
                    className="rounded-lg p-1.5 text-teal-100 transition hover:bg-white/15 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {selectedFacility && (
        <ReportChartModal
          facility={selectedFacility}
          year={year}
          onClose={() => setSelectedFacility(null)}
        />
      )}
    </section>
  )
}
