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

export const authAPI = {
    login: async (email, password) => {
        // OAuth2 expects form data, not JSON
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)

        return axios.post(`${API_URL}/login/access-token`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
    }
}
