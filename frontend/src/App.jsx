import React, { useEffect, useState } from 'react';
import NavigationSidebar from './components/NavigationSidebar';
import InicioView from './views/InicioView';
import ServiciosDashboard from './views/ServiciosDashboard';
import ServiciosSUSView from './views/ServiciosSUSView';
import PacientesDashboard from './views/PacientesDashboard';
import MedicamentosDashboard from './views/MedicamentosDashboard';
import ProduccionDashboard from './views/ProduccionDashboard';
import ReportesDashboard from './views/ReportesDashboard';
import CobrosExcelDashboard from './views/CobrosExcelDashboard';
import Login from './components/Login';
import UserApprovals from './components/UserApprovals';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('sicofs_user') || 'null');
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState(() => (
    window.location.pathname === '/cobros-intermunicipales'
      ? 'cobros-intermunicipales'
      : 'inicio'
  ));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(
        window.location.pathname === '/cobros-intermunicipales'
          ? 'cobros-intermunicipales'
          : 'inicio',
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const nextPath = tab === 'cobros-intermunicipales' ? '/cobros-intermunicipales' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ activeTab: tab }, '', nextPath);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sicofs_user');
    setCurrentUser(null);
    setActiveTab('inicio');
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Lateral Navigation Sidebar */}
      <NavigationSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 min-h-screen ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {activeTab === 'inicio' && (
          <InicioView onNavigate={handleTabChange} />
        )}

        {activeTab === 'servicios' && (
          <ServiciosDashboard />
        )}

        {activeTab === 'servicios-sus' && (
          <ServiciosSUSView />
        )}

        {activeTab === 'pacientes' && (
          <PacientesDashboard />
        )}

        {activeTab === 'medicamentos' && (
          <MedicamentosDashboard />
        )}

        {activeTab === 'produccion' && (
          <ProduccionDashboard />
        )}

        {activeTab === 'reportes' && (
          <ReportesDashboard />
        )}

        {activeTab === 'cobros-intermunicipales' && (
          <CobrosExcelDashboard />
        )}
        {activeTab === 'usuarios-pendientes' && currentUser.rol === 'administrador' && (
          <UserApprovals currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}
