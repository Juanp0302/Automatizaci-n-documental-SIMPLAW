import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { templatesAPI } from '../api/templates'
import { documentsAPI } from '../api/documents'
import './Dashboard.css'

function Dashboard() {
    const { user } = useAuth()
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
        setLoading(true)
        try {
            // Using Promise.allSettled to prevent one failing call from blocking the others
            const [templatesRes, documentsRes] = await Promise.allSettled([
                templatesAPI.getAll(),
                documentsAPI.getAll()
            ])

            const templatesData = templatesRes.status === 'fulfilled' ? templatesRes.value.data : []
            const documentsData = documentsRes.status === 'fulfilled' ? documentsRes.value.data : []

            if (templatesRes.status === 'rejected') console.error('Error loading templates:', templatesRes.reason)
            if (documentsRes.status === 'rejected') console.error('Error loading documents:', documentsRes.reason)

            setStats({
                templates: Array.isArray(templatesData) ? templatesData.length : 0,
                documents: Array.isArray(documentsData) ? documentsData.length : 0,
                recent: Array.isArray(documentsData) ? documentsData.slice(0, 5) : []
            })
        } catch (error) {
            console.error('Unexpected error loading dashboard stats:', error)
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
                    {(user?.has_extractor_access || user?.is_superuser) && (
                        <Link to="/extractor" className="quick-action card">
                            <span className="quick-action-icon">🔍</span>
                            <span className="quick-action-label">Extractor IA</span>
                        </Link>
                    )}
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
                                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES') : 'N/A'}
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
