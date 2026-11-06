import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

export default function VisitCounter() {
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const registeredTotal = Number(sessionStorage.getItem('sicofs_visit_total'));
    if (sessionStorage.getItem('sicofs_visit_registered') === 'true') {
      if (Number.isInteger(registeredTotal)) setTotal(registeredTotal);
      return undefined;
    }

    sessionStorage.setItem('sicofs_visit_registered', 'true');

    fetch('/api/visitas/incrementar', {
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) throw new Error('No se pudo registrar la visita');
        return response.json();
      })
      .then((data) => {
        sessionStorage.setItem('sicofs_visit_total', String(data.total));
        setTotal(data.total);
      })
      .catch(() => {
        sessionStorage.removeItem('sicofs_visit_registered');
        sessionStorage.removeItem('sicofs_visit_total');
        setError(true);
      });

    return undefined;
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
      <div className="rounded-xl bg-sky-100 p-2.5 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300">
        <Eye className="h-5 w-5" />
      </div>
      <div>
        <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Visitas totales</span>
        <span className="text-xl font-black text-slate-800 dark:text-white">
          {error ? 'No disponible' : total === null ? 'Cargando...' : total.toLocaleString('es')}
        </span>
      </div>
    </div>
  );
}
