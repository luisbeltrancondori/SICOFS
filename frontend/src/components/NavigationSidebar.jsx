import React from 'react';
import { Home, Stethoscope, Users, Pill, BarChart3, FileText, ClipboardList, ChevronLeft, ChevronRight, HandCoins, LogOut, UserCheck } from 'lucide-react';
import logoMontero from '../assets/logo-montero.jpg';

export default function NavigationSidebar({ activeTab, onTabChange, isCollapsed, setIsCollapsed, currentUser, onLogout }) {
  const menuItems = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: Home,
    },
    {
      id: 'servicios',
      label: 'Servicios',
      icon: Stethoscope,
      
    },
    {
      id: 'servicios-sus',
      label: 'Servicios SUS',
      icon: ClipboardList,
    },
    {
      id: 'pacientes',
      label: 'Pacientes',
      icon: Users,
    },
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      icon: Pill,
      
    },
    {
      id: 'produccion',
      label: 'Producción',
      icon: BarChart3,
      
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: FileText,
    },
    {
      id: 'cobros-intermunicipales',
      label: 'COBROS INTERMUNICIPALES',
      icon: HandCoins,
    },
    ...(currentUser?.rol === 'administrador' ? [{
      id: 'usuarios-pendientes',
      label: 'Aprobaciones de Usuarios',
      icon: UserCheck,
    }] : []),
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-[#002f3d] dark:bg-[#001f29] text-white flex flex-col transition-all duration-300 border-r border-teal-900/40 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-teal-800/40 bg-[#002733]/60">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1 shadow-sm flex items-center justify-center h-12 w-12 shrink-0">
              <img
                src={logoMontero}
                alt="GAMM"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-black tracking-wider uppercase text-white truncate">
                SALUD MONTERO
              </h2>
              <p className="text-[10px] text-teal-300 font-medium truncate">
                Gestión SICOFS
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto bg-white rounded-xl p-1 shadow-sm flex items-center justify-center h-10 w-10">
            <img
              src={logoMontero}
              alt="GAMM"
              className="h-full w-full object-contain"
            />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800/50 transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => !item.disabled && onTabChange(item.id)}
              disabled={item.disabled}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 relative group ${
                isActive
                  ? 'bg-gradient-to-r from-[#00a3e0] to-[#0284c7] text-white shadow-lg shadow-sky-600/30 scale-[1.02]'
                  : item.disabled
                  ? 'text-teal-400/40 cursor-not-allowed opacity-60'
                  : 'text-teal-100/90 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-teal-200 group-hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span className="tracking-wide">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 shadow-xs">
                      {item.badge}
                    </span>
                  )}
                  {item.hint && (
                    <span className="text-[9px] text-teal-300/40 font-normal">
                      {item.hint}
                    </span>
                  )}
                </div>
              )}

              {/* Active Pill Indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-white rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Widget */}
      <div className="p-3 border-t border-teal-800/40 bg-[#002733]/60 text-center">
        {!isCollapsed ? (
          <>
            <div className="mb-2 truncate text-[10px] font-bold text-teal-100">{currentUser?.nombre || currentUser?.email}</div>
            <button
              onClick={onLogout}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/25"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
            <div className="text-[10px] text-teal-300/70 font-medium leading-relaxed">
              <span className="block font-bold text-white text-[11px]">Sistema SICOFS</span>
              Gobierno Autónomo Municipal de Montero
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 text-teal-300 hover:text-white"
            title="Expandir menú"
          >
            <ChevronRight className="w-4 h-4 mx-auto" />
          </button>
        )}
      </div>
    </aside>
  );
}
