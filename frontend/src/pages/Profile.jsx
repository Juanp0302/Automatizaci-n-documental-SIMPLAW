import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api/client'
import './Profile.css'

function Profile() {
    const { user, fetchProfile } = useAuth()
    const toast = useToast()

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [saving, setSaving] = useState(false)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    const handlePasswordChange = async (e) => {
        e.preventDefault()

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        if (passwordForm.newPassword.length < 4) {
            toast.error('La contraseña debe tener al menos 4 caracteres')
            return
        }

        setSaving(true)
        try {
            await api.put('/users/me', {
                password: passwordForm.newPassword
            })
            toast.success('Contraseña actualizada exitosamente')
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setShowPasswordForm(false)
        } catch (err) {
            console.error(err)
            toast.error('Error al actualizar la contraseña')
        } finally {
            setSaving(false)
        }
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
        <div className="profile-page animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Mi Perfil</h1>
                <p className="page-description">
                    Información de tu cuenta y configuración
                </p>
            </div>

            {/* Profile Info Card */}
            <div className="profile-card card">
                <div className="profile-avatar-large">
                    {getInitials(user?.full_name || user?.email)}
                </div>
                <div className="profile-info">
                    <h2 className="profile-name">{user?.full_name || 'Sin nombre'}</h2>
                    <p className="profile-email">{user?.email}</p>
                    <span className={`profile-badge ${user?.is_superuser ? 'badge-admin' : 'badge-user'}`}>
                        {user?.is_superuser ? '👑 Administrador' : '👤 Usuario'}
                    </span>
                </div>
            </div>

            {/* Security Section */}
            <div className="profile-section card">
                <div className="section-header">
                    <h2 className="form-section-title">🔒 Seguridad</h2>
                    {!showPasswordForm && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowPasswordForm(true)}
                        >
                            Cambiar Contraseña
                        </button>
                    )}
                </div>

                {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="password-form">
                        <div className="form-group">
                            <label className="form-label">Nueva Contraseña</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    setPasswordForm((prev) => ({
                                        ...prev,
                                        newPassword: e.target.value,
                                    }))
                                }
                                placeholder="Ingresa nueva contraseña"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmar Contraseña</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    setPasswordForm((prev) => ({
                                        ...prev,
                                        confirmPassword: e.target.value,
                                    }))
                                }
                                placeholder="Confirma nueva contraseña"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowPasswordForm(false)
                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Actualizar Contraseña'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Profile
