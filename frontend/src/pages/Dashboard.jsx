import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { templatesAPI } from '../api/templates'
import { documentsAPI } from '../api/documents'
import './Dashboard.css'

function Dashboard() {
    const [stats, setStats] = useState({
        templates: 0,
        documents: 0,
        recent: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const [templatesRes, documentsRes] = await Promise.all([
                templatesAPI.getAll(),
                documentsAPI.getAll()
            ])

            setStats({
                templates: templatesRes.data?.length || 0,
                documents: documentsRes.data?.length || 0,
                recent: documentsRes.data?.slice(0, 5) || []
            })
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="dashboard animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">
                    Bienvenido al sistema de automatización de documentos legales
                </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card card">
                    <div className="stat-icon stat-icon-templates">📋</div>
                    <div className="stat-content">
                        <h3 className="stat-value">
                            {loading ? <span className="spinner"></span> : stats.templates}
                        </h3>
                        <p className="stat-label">Plantillas Disponibles</p>
                    </div>
                    <Link to="/templates" className="stat-link">Ver todas →</Link>
                </div>

                <div className="stat-card card">
                    <div className="stat-icon stat-icon-documents">📁</div>
                    <div className="stat-content">
                        <h3 className="stat-value">
                            {loading ? <span className="spinner"></span> : stats.documents}
                        </h3>
                        <p className="stat-label">Documentos Generados</p>
                    </div>
                    <Link to="/documents" className="stat-link">Ver todos →</Link>
                </div>

                <div className="stat-card stat-card-cta card">
                    <div className="stat-icon stat-icon-new">✨</div>
                    <div className="stat-content">
                        <h3 className="stat-cta-title">Crear Documento</h3>
                        <p className="stat-label">Genera un nuevo documento desde una plantilla</p>
                    </div>
                    <Link to="/documents/new" className="btn btn-primary">
                        Comenzar →
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-section">
                <h2 className="section-title">Acciones Rápidas</h2>
                <div className="quick-actions">
                    <Link to="/documents/new" className="quick-action card">
                        <span className="quick-action-icon">📄</span>
                        <span className="quick-action-label">Nuevo Documento</span>
                    </Link>
                    <Link to="/templates" className="quick-action card">
                        <span className="quick-action-icon">📋</span>
                        <span className="quick-action-label">Ver Plantillas</span>
                    </Link>
                    <Link to="/documents" className="quick-action card">
                        <span className="quick-action-icon">📂</span>
                        <span className="quick-action-label">Mis Documentos</span>
                    </Link>
                </div>
            </div>

            {/* Recent Documents */}
            {stats.recent.length > 0 && (
                <div className="dashboard-section">
                    <h2 className="section-title">Documentos Recientes</h2>
                    <div className="recent-list card">
                        {stats.recent.map((doc) => (
                            <div key={doc.id} className="recent-item">
                                <span className="recent-icon">📄</span>
                                <div className="recent-info">
                                    <span className="recent-title">{doc.title}</span>
                                    <span className="recent-date">
                                        {new Date(doc.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
