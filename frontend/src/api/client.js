import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

// Attach JWT token from localStorage to every request
client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('bilimai_user')
  if (stored) {
    try {
      const { access_token } = JSON.parse(stored)
      if (access_token) config.headers.Authorization = `Bearer ${access_token}`
    } catch {}
  }
  return config
})

// Extract response data, forward errors
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

export default client
