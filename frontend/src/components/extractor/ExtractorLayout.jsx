import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, PanelLeftClose, 
  PanelLeft, Inbox, FileSearch, Database, 
  ShieldAlert, BarChart2, Home, Settings
} from 'lucide-react';
import '../../styles/extractor.css';
import logo from '../../assets/simplaw-logo.png';

const ExtractorLayout = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isProjectActive = !!projectId;

  const navItems = isProjectActive ? [
    { icon: LayoutDashboard, label: 'Resumen',     path: `/extractor/projects/${projectId}` },
    { icon: Inbox,           label: 'Revisión',     path: `/extractor/projects/${projectId}/review` },
    { icon: Database,        label: 'Campos',       path: `/extractor/projects/${projectId}/schema` },
    { icon: ShieldAlert,     label: 'Reglas',       path: `/extractor/projects/${projectId}/rules` },
    { icon: FileSearch,      label: 'Explorador',   path: `/extractor/projects/${projectId}/documents` },
    { icon: BarChart2,       label: 'Exportar',     path: `/extractor/projects/${projectId}/exports` },
    { icon: Settings,        label: 'Configuración', path: '/extractor/settings' },
  ] : [
    { icon: FolderOpen, label: 'Proyectos', path: '/extractor' },
    { icon: Settings,   label: 'Configuración', path: '/extractor/settings' },
  ];

  return (
    <div className="extractor-theme">
      <aside className={`sidebar-ei transition-all duration-300 flex flex-col ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}>
        {/* Logo */}
        <div className="flex items-center justify-center border-b border-white/5" style={{ minHeight: '64px' }}>
          {!collapsed ? (
            <div className="flex flex-col items-center gap-0.5">
              <div style={{
                backgroundImage: `url(${logo})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                height: '22px',
                width: '140px',
              }} />
              <span className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                Extractor
              </span>
            </div>
          ) : (
            <div style={{
              backgroundImage: `url(${logo})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              height: '18px',
              width: '18px',
            }} />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 flex flex-col gap-1 overflow-y-auto">
          <button 
            onClick={() => navigate('/')}
            className={`sidebar-item-ei mb-3 border border-white/5 ${collapsed ? 'justify-center px-0' : ''}`}
            title="Volver a Automatización"
          >
            <Home size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-xs font-medium">Volver a Inicio</span>}
          </button>

          <div className="h-px bg-white/5 mx-2 mb-2" />

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/extractor' || item.path === `/extractor/projects/${projectId}`}
              className={({ isActive }) =>
                `sidebar-item-ei ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`sidebar-item-ei ${collapsed ? 'justify-center px-0' : ''}`}
            title="Colapsar menú"
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: 'var(--ei-bg-primary)' }}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ExtractorLayout;
