import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(email, password)

        if (result.success) {
            navigate('/')
        } else {
            setError(result.error)
        }

        setLoading(false)
    }

    return (
        <div className="login-page">
            <div className="login-container glass animate-slide-up">
                <div className="login-header">
                    <div className="login-logo">
                        <img src="/logo.jpg" alt="Simplaw" className="logo-image-login" />
                    </div>
                    {/* Removed text title as logo likely contains it or user wants logo only. Keeping title for now if logo is icon only, but user showed full logotype. Let's hide title if logo is present? User said "in place of DocuLegal". So I will comment out title? Or just keep it? "necesito que en lugar de DocuLegal esté el logo". Okay, remove DocuLegal text. */}
                    {/* <h1 className="login-title">DocuLegal</h1> */}
                    <p className="login-subtitle">Automatización de Documentos Legales</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error animate-fade-in">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Iniciando sesión...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Sistema de gestión documental</p>
                    <div className="branding-footer-login">
                        <span className="branding-text">Empowered by</span>
                        <a href="https://www.simplaw.co" target="_blank" rel="noopener noreferrer" className="simplaw-link">
                            www.simplaw.co
                        </a>
                    </div>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="login-decoration">
                <div className="decoration-circle decoration-circle-1"></div>
                <div className="decoration-circle decoration-circle-2"></div>
                <div className="decoration-circle decoration-circle-3"></div>
            </div>
        </div>
    )
}

export default Login
