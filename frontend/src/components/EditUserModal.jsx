
import { useState, useEffect } from 'react'
import { usersAPI } from '../api/users'
import { useToast } from '../context/ToastContext'
import './CreateUserModal.css' // Reuse styles

function EditUserModal({ isOpen, onClose, onSuccess, user }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        is_superuser: false,
        is_active: true
    })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const toast = useToast()

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                password: '', // Password empty by default
                full_name: user.full_name || '',
                is_superuser: user.is_superuser || false,
                is_active: user.is_active ?? true
            })
        }
    }, [user])

    if (!isOpen || !user) return null

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            // Filter out empty password so we don't overwrite it with empty string
            const dataToUpdate = { ...formData }
            if (!dataToUpdate.password) {
                delete dataToUpdate.password
            }

            await usersAPI.update(user.id, dataToUpdate)
            toast.success('Usuario actualizado exitosamente')
            onSuccess()
        } catch (err) {
            const msg = err.response?.data?.detail || 'Error al actualizar usuario'
            setError(msg)
            toast.error(msg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container user-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Editar Usuario</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-banner">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nombre Completo</label>
                            <input
                                type="text"
                                name="full_name"
                                className="form-input"
                                value={formData.full_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Nueva Contraseña (Opcional)</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Dejar en blanco para mantener la actual"
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_superuser"
                                    checked={formData.is_superuser}
                                    onChange={handleChange}
                                />
                                Es Administrador (Superuser)
                            </label>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                />
                                Usuario Activo
                            </label>
                        </div>

                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    )
}

export default EditUserModal
