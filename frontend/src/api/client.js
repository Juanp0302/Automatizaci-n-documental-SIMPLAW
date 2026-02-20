import axios from 'axios'

// Determine the API URL based on the environment
let API_URL;
if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('/')) {
    // If it's a relative path, use the current origin + path
    API_URL = `${window.location.origin}${import.meta.env.VITE_API_URL}`;
} else if (import.meta.env.VITE_API_URL) {
    API_URL = import.meta.env.VITE_API_URL;
} else {
    // CRITICAL FIX: Default to relative path /api/v1 in production if env vars are missing during docker build
    // Localhost development will still work because Vite proxies /api to backend anyway
    API_URL = '/api/v1';
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
