import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

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
