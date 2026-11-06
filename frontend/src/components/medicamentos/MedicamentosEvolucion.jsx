import React, { useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, Boxes } from 'lucide-react';

function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('es-BO');
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return '0,00';
  return `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CustomCostTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-extrabold text-amber-300 mb-1">{data.mesNombre} ({data.mes})</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">Gasto Ejecutado:</span>
            <span className="font-bold text-white">{formatCurrency(data.costoTotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">Unidades Dispensadas:</span>
            <span className="font-bold text-teal-300">{formatNumber(data.cantidad)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">Recetas Emitidas:</span>
            <span className="font-bold text-sky-300">{formatNumber(data.recetas)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomCantTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-extrabold text-teal-300 mb-1">{data.mesNombre}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">Cantidad Dispensada:</span>
            <span className="font-bold text-white">{formatNumber(data.cantidad)} unid.</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-300">Costo del Mes:</span>
            <span className="font-bold text-amber-300">{formatCurrency(data.costoTotal)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function MedicamentosEvolucion({ data, selectedMonth, onSelectMonth }) {
  const list = data || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

      {/* Gráfico C: Evolución Mensual del Gasto */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Evolución Mensual del Gasto Presupuestario
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tendencia monetaria de ejecución de medicamentos (Bs.)
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={list} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gastoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="mesNombre" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip content={<CustomCostTooltip />} />
              <Area 
                type="monotone" 
                dataKey="costoTotal" 
                stroke="#d97706" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#gastoGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico D: Evolución Mensual de Cantidades (Unidades) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 p-5 flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Evolución Mensual de Cantidades Dispensadas
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Volumen físico de unidades distribuidas a pacientes
              </p>
            </div>
          </div>
        </div>

        <div className="h-56 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={list} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="mesNombre" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip content={<CustomCantTooltip />} />
              <Bar 
                dataKey="cantidad" 
                fill="#0d9488" 
                radius={[6, 6, 0, 0]}
                onClick={(entry) => onSelectMonth && onSelectMonth(String(entry.mes))}
                className="cursor-pointer hover:opacity-80 transition"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
