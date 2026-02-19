import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedToken = localStorage.getItem('token')
        if (storedToken) {
            setToken(storedToken)
            fetchProfile()
        } else {
            setLoading(false)
        }
    }, [])

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me')
            setUser(response.data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            // If token is invalid, clear it
            if (error.response?.status === 401) {
                localStorage.removeItem('token')
                setToken(null)
            }
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            const response = await authAPI.login(email, password)
            const { access_token } = response.data

            localStorage.setItem('token', access_token)
            setToken(access_token)

            // Fetch user profile after login
            try {
                const profileRes = await api.get('/users/me')
                setUser(profileRes.data)
            } catch (err) {
                console.error('Error fetching profile after login:', err)
            }

            return { success: true }
        } catch (error) {
            const message = error.response?.data?.detail || 'Error al iniciar sesión'
            return { success: false, error: message }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    const isAuthenticated = !!token

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner spinner-lg"></div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, fetchProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
