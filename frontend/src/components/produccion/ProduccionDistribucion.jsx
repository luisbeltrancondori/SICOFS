import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Layers, Building2 } from 'lucide-react';

function fmt(n) {
  if (!n || isNaN(n)) return 'Bs. 0,00';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtShort(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `Bs. ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `Bs. ${(n / 1_000).toFixed(0)}K`;
  return `Bs. ${Math.round(n)}`;
}

const GRUPO_COLORS = { T: '#7c3aed', S: '#0d9488' };
const NIVEL_COLORS = { '2DO. NIVEL': '#7c3aed', '1ER. NIVEL': '#0d9488' };

const CustomDonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-black text-slate-800 dark:text-white mb-1">{d.label}</p>
      <p className="text-slate-600 dark:text-slate-300">{fmt(d.costoTotal)}</p>
      <p className="text-slate-400">{d.porcentaje}% del total</p>
      <p className="text-slate-400">{d.registros?.toLocaleString('es-BO')} registros</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, porcentaje }) => {
  if (porcentaje < 5) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={800}>
      {porcentaje}%
    </text>
  );
};

export default function ProduccionDistribucion({ distribucionGrupo = [], distribucionNivel = [] }) {
  // Only show donut if multiple groups present
  const multiGrupo = distribucionGrupo.length > 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut: Distribución por Grupo */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Distribución por Grupo</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Participación económica S vs T</p>
          </div>
        </div>

        {distribucionGrupo.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">Sin datos</div>
        ) : !multiGrupo ? (
          // Single group — show card instead of donut
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <div className="p-4 rounded-2xl text-center" style={{ background: `${GRUPO_COLORS[distribucionGrupo[0].grupo]}20` }}>
              <span className="text-3xl font-black" style={{ color: GRUPO_COLORS[distribucionGrupo[0].grupo] }}>
                100%
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">{distribucionGrupo[0].label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{fmt(distribucionGrupo[0].costoTotal)}</p>
            </div>
            <p className="text-[10px] text-slate-400 italic text-center">
              Filtro activo: un solo grupo seleccionado
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={distribucionGrupo} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="costoTotal" nameKey="label" paddingAngle={2}
                  labelLine={false} label={renderCustomLabel}>
                  {distribucionGrupo.map((entry, i) => (
                    <Cell key={i} fill={GRUPO_COLORS[entry.grupo] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomDonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 flex-wrap mt-1">
              {distribucionGrupo.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: GRUPO_COLORS[g.grupo] || '#94a3b8' }} />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{g.label}</span>
                  <span className="text-[10px] text-slate-400">({g.porcentaje}%)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Distribución por Nivel de Atención */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Distribución por Nivel de Atención</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">1er vs 2do nivel · monto y establecimientos activos</p>
          </div>
        </div>

        {distribucionNivel.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400">Sin datos</div>
        ) : (
          <div className="space-y-4 mt-2">
            {distribucionNivel.map((n, i) => {
              const color = NIVEL_COLORS[n.nivel] || '#94a3b8';
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="font-bold text-slate-800 dark:text-slate-100">{n.nivel}</span>
                      <span className="text-slate-400">({n.establecimientos} establ.)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 dark:text-white">
                        {fmt(n.costoTotal)}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: color }}>
                        {n.porcentaje}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${n.porcentaje}%`, background: color }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {n.registros?.toLocaleString('es-BO')} registros de producción
                  </p>
                </div>
              );
            })}

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              {distribucionNivel.map((n, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                    {n.establecimientos}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider">{n.nivel.split('.')[0].trim()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
