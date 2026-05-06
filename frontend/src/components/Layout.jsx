import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

function Layout() {
    const { logout, user, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getInitials = (name) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="layout">
            {/* Mobile Header */}
            <div className="mobile-header">
                <div className="logo">
                    <img src="/logo.jpg" alt="Simplaw" className="logo-image" />
                </div>
                <button 
                    className="mobile-menu-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <img src="/logo.jpg" alt="Simplaw" className="logo-image" />
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink 
                        to="/" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} 
                        end
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <span className="nav-icon">🏠</span>
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink 
                        to="/templates" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <span className="nav-icon">📋</span>
                        <span>Plantillas</span>
                    </NavLink>

                    <NavLink 
                        to="/documents" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <span className="nav-icon">📁</span>
                        <span>Documentos</span>
                    </NavLink>

                    <NavLink 
                        to="/documents/new" 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <span className="nav-icon">✨</span>
                        <span>Nuevo Documento</span>
                    </NavLink>

                    {(user?.has_extractor_access || user?.is_superuser) && (
                        <NavLink 
                            to="/extractor" 
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <span className="nav-icon">🔍</span>
                            <span>Extractor</span>
                        </NavLink>
                    )}

                    {user?.is_superuser && (
                        <>
                            <NavLink 
                                to="/users" 
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="nav-icon">👥</span>
                                <span>Usuarios</span>
                            </NavLink>
                            <NavLink 
                                to="/statistics" 
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <span className="nav-icon">📊</span>
                                <span>Estadísticas</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/profile" className={({ isActive }) => `user-profile-link ${isActive ? 'active' : ''}`}>
                        <div className="user-avatar">
                            {getInitials(user?.full_name || user?.email)}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.full_name || 'Usuario'}</span>
                            <span className="user-email">{user?.email || ''}</span>
                        </div>
                    </NavLink>
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        <span>Cerrar Sesión</span>
                    </button>

                    <div className="branding-footer">
                        <span className="branding-text">Empowered by</span>
                        <a href="https://www.simplaw.co" target="_blank" rel="noopener noreferrer" className="simplaw-link">
                            www.simplaw.co
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
