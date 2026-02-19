import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ adminOnly = false }) {
    const { isAuthenticated, user, loading } = useAuth()

    if (loading) return <div className="page-loading"><div className="spinner"></div></div>

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (adminOnly && !user?.is_superuser) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
