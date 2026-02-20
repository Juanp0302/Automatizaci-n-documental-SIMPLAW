import axios from 'axios'

// Determine the API URL based on the environment
let API_URL;
if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('/')) {
    // If it's a relative path (like in production), use the current origin + path
    API_URL = `${window.location.origin}${import.meta.env.VITE_API_URL}`;
} else {
    // Otherwise rely on the environment variable as-is (e.g., localhost direct URL)
    API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
}

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add token to all requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Handle 401 responses (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
