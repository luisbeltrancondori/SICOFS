import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, Building2, PieChart as PieIcon } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('es-BO');
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '0,00';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const TIPO_COLORS = {
  'Medicamento Esencial': '#0077b6',
  'Insumo Esencial': '#0096c7',
  'Medicamento No Esencial': '#48cae4',
  'Insumo No Esencial': '#90e0ef',
  'Reactivo Esencial': '#00b4d8',
  'Reactivo No Esencial': '#caf0f8',
  'Sin Clasificar': '#94a3b8',
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          <span className="font-bold">{d.tipo}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-300">Gasto:</span>
          <span className="font-extrabold text-white">{formatCurrency(d.costoTotal)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-300">Participación:</span>
          <span className="font-bold text-sky-300">{d.porcentajeGasto}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-300">Cantidad:</span>
          <span className="font-medium text-slate-300">{formatNumber(d.cantidad)} unid.</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function MedicamentosDistribucion({
  distribucionGrupo,
  distribucionEstablecimiento,
  onSelectEstablishment,
  onSelectGroup,
}) {
  const grupos = distribucionGrupo || [];
  const establecimientos = distribucionEstablecimiento || [];

  const pieData = grupos.map((g, idx) => ({
    ...g,
    color: TIPO_COLORS[g.tipo] || '#64748b',
  }));

  const maxEstCost = Math.max(...establecimientos.map((e) => e.costoTotal || 0), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">

      {/* Gráfico E: Distribución por Grupo Farmacéutico / Tipo Suministro */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Distribución por Grupo de Suministro
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clasificación oficial de medicamentos e insumos
              </p>
            </div>
          </div>
        </div>

        <div className="h-52 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="costoTotal"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {pieData.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectGroup && onSelectGroup(item.tipo)}
              className="flex items-center justify-between text-[11px] p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-700 dark:text-slate-200 truncate font-semibold">
                  {item.tipo}
                </span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                {item.porcentajeGasto}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico F: Distribución del Gasto por Establecimiento */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Gasto en Medicamentos por Establecimiento de Salud
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Centros con mayor asignación y consumo presupuestario
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 flex-1">
          {establecimientos.slice(0, 6).map((est, idx) => {
            const pct = Math.min(100, Math.round((est.costoTotal / maxEstCost) * 100));
            return (
              <div
                key={est.idEstablecimiento || idx}
                onClick={() => onSelectEstablishment && onSelectEstablishment(est.idEstablecimiento)}
                className="group cursor-pointer rounded-xl p-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2 truncate max-w-[260px] sm:max-w-[340px]">
                    <span className={`w-4 text-[10px] font-black ${idx < 2 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors uppercase">
                      {est.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({est.nivel})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded">
                      {est.porcentajeGasto}%
                    </span>
                    <span className="font-black text-slate-800 dark:text-white tabular-nums">
                      {formatCurrency(est.costoTotal)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                        : idx === 1
                        ? 'bg-gradient-to-r from-indigo-500 to-sky-500'
                        : 'bg-gradient-to-r from-purple-400 to-purple-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
