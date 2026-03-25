import { useState, useEffect } from 'react'
import { usersAPI } from '../api/users'
import { useToast } from '../context/ToastContext'

function Statistics() {
    const [stats, setStats] = useState({ by_user: [], by_template: [] })
    const [loadingStats, setLoadingStats] = useState(true)
    const toast = useToast()

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        setLoadingStats(true)
        try {
            const response = await usersAPI.getStatistics()
            setStats(response.data)
        } catch (err) {
            console.error(err)
            toast.error('Error al cargar estadísticas')
        } finally {
            setLoadingStats(false)
        }
    }

    return (
        <div className="users-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Estadísticas de Uso</h1>
                <p className="page-description">Visualiza analíticas y uso de las plantillas del sistema</p>
            </div>

            <div className="stats-container animate-slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                {loadingStats ? (
                     <div className="card page-loading" style={{ minHeight: '300px', gridColumn: '1 / -1' }}><div className="spinner"></div></div>
                ) : (
                    <>
                        {/* Stats by User */}
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>📄 Documentos por Usuario</h2>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Email</th>
                                            <th style={{ textAlign: 'center' }}>Total Generados</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.by_user.length === 0 ? (
                                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Sin datos</td></tr>
                                        ) : stats.by_user.sort((a,b) => b.document_count - a.document_count).map(row => (
                                            <tr key={row.user_id}>
                                                <td>{row.full_name}</td>
                                                <td>{row.email}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                    <span className="badge badge-primary">{row.document_count}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Stats by Template */}
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>📈 Documentos por Plantilla</h2>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Plantilla</th>
                                            <th style={{ textAlign: 'center' }}>Total Generados</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.by_template.length === 0 ? (
                                            <tr><td colSpan="2" style={{ textAlign: 'center' }}>Sin datos</td></tr>
                                        ) : stats.by_template.sort((a,b) => b.document_count - a.document_count).map(row => (
                                            <tr key={row.template_id}>
                                                <td>{row.title}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                    <span className="badge badge-success">{row.document_count}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Statistics
