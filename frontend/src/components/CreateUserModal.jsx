
import { useState } from 'react'
import { usersAPI } from '../api/users'
import { useToast } from '../context/ToastContext'
import './CreateUserModal.css'

function CreateUserModal({ isOpen, onClose, onSuccess }) {
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

    if (!isOpen) return null

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
            await usersAPI.create(formData)
            toast.success('Usuario creado exitosamente')
            onSuccess()
            // Reset form
            setFormData({
                email: '',
                password: '',
                full_name: '',
                is_superuser: false,
                is_active: true
            })
        } catch (err) {
            const msg = err.response?.data?.detail || 'Error al crear usuario'
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
                    <h3>Nuevo Usuario</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
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
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
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
                        <p className="help-text">Los administradores tienen acceso total al sistema.</p>
                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Creando...' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateUserModal
