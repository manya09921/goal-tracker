import axios from 'axios'

// Use relative path — Vite proxy forwards /api → http://localhost:5000/api in dev
// In production, set VITE_API_BASE_URL env var or serve frontend from the same origin
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
}

// ─── Goals ───────────────────────────────────────────────
export const goalsAPI = {
  getAll: (params) => api.get('/goals', { params }),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.patch(`/goals/${id}`, data),
  submit: (id) => api.patch(`/goals/${id}/submit`),
  delete: (id) => api.delete(`/goals/${id}`),
  approve: (id, data) => api.patch(`/goals/${id}/approve`, data),
  reject: (id, data) => api.patch(`/goals/${id}/reject`, data),
  managerEdit: (id, data) => api.patch(`/goals/${id}/manager-edit`, data),
  getSummary: (userId) => api.get(`/goals/summary/${userId}`),
}

// ─── Checkins ────────────────────────────────────────────
export const checkinsAPI = {
  getAll: (params) => api.get('/checkins', { params }),
  getByGoal: (goalId) => api.get(`/checkins/goal/${goalId}`),
  create: (data) => api.post('/checkins', data),
  update: (id, data) => api.patch(`/checkins/${id}`, data),
}

// ─── Users ───────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
}

export default api
