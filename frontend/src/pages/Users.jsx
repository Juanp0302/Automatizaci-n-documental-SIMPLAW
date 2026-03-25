import { useState, useEffect } from 'react'
import { usersAPI } from '../api/users'
import { useToast } from '../context/ToastContext'
import CreateUserModal from '../components/CreateUserModal'
import EditUserModal from '../components/EditUserModal'
import ConfirmModal from '../components/ConfirmModal'
import './Users.css'

function Users() {
    const [activeTab, setActiveTab] = useState('users') // 'users' or 'stats'
    
    // Users State
    const [users, setUsers] = useState([])
    const [loadingUsers, setLoadingUsers] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [userToDelete, setUserToDelete] = useState(null)
    
    // Stats State
    const [stats, setStats] = useState({ by_user: [], by_template: [] })
    const [loadingStats, setLoadingStats] = useState(false)

    const toast = useToast()

    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers()
        } else if (activeTab === 'stats') {
            loadStats()
        }
    }, [activeTab])

    const loadUsers = async () => {
        setLoadingUsers(true)
        try {
            const response = await usersAPI.getAll()
            setUsers(response.data || [])
        } catch (err) {
            console.error(err)
            toast.error('Error al cargar usuarios')
        } finally {
            setLoadingUsers(false)
        }
    }

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

    const handleUserCreated = () => {
        loadUsers()
        setIsModalOpen(false)
    }

    const handleUserUpdated = () => {
        loadUsers()
        setSelectedUser(null)
    }

    const toggleStatus = async (user) => {
        if (user.is_superuser) return; // Prevent disabling superuser

        try {
            await usersAPI.update(user.id, { is_active: !user.is_active })
            toast.success(`Usuario ${user.is_active ? 'desactivado' : 'activado'} correctamente`)
            loadUsers()
        } catch (err) {
            console.error(err)
            toast.error('Error al actualizar estado')
        }
    }

    const confirmDelete = (user) => {
        setUserToDelete(user)
    }

    const handleDelete = async () => {
        if (!userToDelete) return

        try {
            await usersAPI.delete(userToDelete.id)
            toast.success('Usuario eliminado correctamente')
            loadUsers()
        } catch (err) {
            console.error(err)
            const msg = err.response?.data?.detail || 'Error al eliminar usuario'
            toast.error(msg)
        } finally {
            setUserToDelete(null)
        }
    }

    return (
        <div className="users-page animate-fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title">Gestión de Usuarios</h1>
                    <p className="page-description">Administra el acceso al sistema y visualiza métricas de uso</p>
                </div>
                {activeTab === 'users' && (
                    <button
                        className="btn btn-primary"
                        onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
                    >
                        + Nuevo Usuario
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #eef2f6', paddingBottom: '0.5rem' }}>
                <button 
                    className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Usuarios Registrados
                </button>
                <button 
                    className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('stats')}
                >
                    Estadísticas de Uso
                </button>
            </div>

            {/* Content: Users Tab */}
            {activeTab === 'users' && (
                <div className="card animate-slide-up">
                    {loadingUsers ? (
                         <div className="page-loading" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>#{user.id}</td>
                                            <td>
                                                <div className="user-name">{user.full_name}</div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`badge ${user.is_superuser ? 'badge-primary' : 'badge-secondary'}`}>
                                                    {user.is_superuser ? 'Administrador' : 'Usuario'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button
                                                        className="btn-icon"
                                                        title={user.is_active ? "Desactivar" : "Activar"}
                                                        onClick={() => toggleStatus(user)}
                                                        disabled={user.is_superuser}
                                                    >
                                                        {user.is_active ? '🛑' : '✅'}
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        title="Editar"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-icon-danger"
                                                        title="Eliminar"
                                                        onClick={() => confirmDelete(user)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Content: Statistics Tab */}
            {activeTab === 'stats' && (
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
            )}

            {/* Modals */}
            <CreateUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleUserCreated}
            />

            <EditUserModal
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                onSuccess={handleUserUpdated}
                user={selectedUser}
            />

            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDelete}
                title="Eliminar Usuario"
                message={`¿Estás seguro de que deseas eliminar al usuario ${userToDelete?.email}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                danger={true}
            />
        </div>
    )
}

export default Users
