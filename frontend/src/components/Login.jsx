import React, { useState } from 'react';
import { LockKeyhole, LogIn, Mail, UserRound } from 'lucide-react';
import logoMontero from '../assets/logo-montero.jpg';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);


  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email, password }
        : { nombre, email, password };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (mode === 'login' ? 'No se pudo iniciar sesión' : 'No se pudo enviar el registro'));
      }

      if (mode === 'register') {
        setError('');
        setPassword('');
        setMode('login');
        setSuccess(data.message);
        return;
      }

      sessionStorage.setItem('sicofs_user', JSON.stringify(data));
      onLogin(data);
    } catch (requestError) {
      setSuccess('');
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-teal-50 to-sky-100 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-7 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
            <img src={logoMontero} alt="GAM Montero" className="h-full w-full object-contain" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-teal-600">SICOFS</span>
          <h1 className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? 'Acceso al Sistema de Control Financiero de Salud' : 'El registro quedará pendiente de aprobación'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Nombre completo</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Nombre y apellidos"
                />
              </div>
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Correo electrónico</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="usuario@sicofs.gob.bo"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Contraseña</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Ingrese su contraseña"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#045d6e] px-4 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/20 transition hover:bg-[#034b59] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading
              ? (mode === 'login' ? 'Ingresando...' : 'Enviando...')
              : (mode === 'login' ? 'Ingresar al sistema' : 'Solicitar registro')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
            setSuccess('');
          }}
          className="mt-5 w-full text-center text-sm font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
        >
          {mode === 'login' ? '¿No tienes cuenta? Crear una cuenta' : 'Volver al inicio de sesión'}
        </button>
      </div>
    </div>
  );
}
