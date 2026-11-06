import React from 'react';
import { Calendar, Heart } from 'lucide-react';

export default function Footer({ lastUpdated }) {
  const dateStr = lastUpdated
    ? lastUpdated.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <footer className="mt-8 pt-4 pb-8 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 max-w-screen-2xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold italic tracking-wide text-sm">
          <Heart className="w-4 h-4 text-teal-600 fill-teal-500/20 inline" />
          <span>Más salud, mejor futuro</span>
        </div>

        <div className="text-center sm:text-left text-[11px] text-slate-500 dark:text-slate-400">
          Gobierno Autónomo Municipal de Montero • Instancia Técnica de Salud • SICOFS
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Datos actualizados: <span className="font-bold">{dateStr}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
