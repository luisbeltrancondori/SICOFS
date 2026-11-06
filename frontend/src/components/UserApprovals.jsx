import React, { useEffect, useState } from 'react';
import { Check, UserCheck, X } from 'lucide-react';

export default function UserApprovals({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadPending() {
    try {
      const response = await fetch('/api/auth/pending', {
        headers: { 'x-admin-email': currentUser.email },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los registros');
      setUsers(data);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { loadPending(); }, []);

  async function resolveUser(email, action) {
    try {
      const response = await fetch('/api/auth/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser.email,
        },
        body: JSON.stringify({ email, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo procesar la solicitud');
      setMessage(data.message);
      await loadPending();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-teal-100 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><UserCheck className="h-6 w-6" /></div>
          <div><h1 className="text-xl font-black text-slate-800 dark:text-white">Solicitudes de acceso</h1><p className="text-sm text-slate-500">Usuarios pendientes de aprobación</p></div>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>}

        {users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No hay solicitudes pendientes.</div>
        ) : users.map((user) => (
          <div key={user.email} className="mb-3 flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <div><p className="font-black text-slate-800 dark:text-white">{user.nombre}</p><p className="text-sm text-slate-500">{user.email}</p></div>
            <div className="flex gap-2">
              <button onClick={() => resolveUser(user.email, 'aprobar')} className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"><Check className="h-4 w-4" /> Aprobar</button>
              <button onClick={() => resolveUser(user.email, 'rechazar')} className="flex items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700"><X className="h-4 w-4" /> Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
