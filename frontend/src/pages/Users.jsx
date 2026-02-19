
import { useState, useEffect } from 'react'
import { usersAPI } from '../api/users'
import { useToast } from '../context/ToastContext'
import CreateUserModal from '../components/CreateUserModal'
import EditUserModal from '../components/EditUserModal'
import ConfirmModal from '../components/ConfirmModal'
import './Users.css'

function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null) // For editing if needed
    const [userToDelete, setUserToDelete] = useState(null)
    const toast = useToast()

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const response = await usersAPI.getAll()
            setUsers(response.data || [])
        } catch (err) {
            console.error(err)
            toast.error('Error al cargar usuarios')
        } finally {
            setLoading(false)
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
        if (user.is_superuser) return; // Prevent disabling superuser for safety in this basic version

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

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>

    return (
        <div className="users-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestión de Usuarios</h1>
                    <p className="page-description">Administra el acceso al sistema</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
                >
                    + Nuevo Usuario
                </button>
            </div>

            <div className="card">
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
                                                disabled={user.is_superuser} // Safety
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
            </div>

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
