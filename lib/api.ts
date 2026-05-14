import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Tokens en memoria (no localStorage — más seguro)
let accessToken: string | null = null
let refreshToken: string | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  // Persiste refresh en cookie httpOnly via servidor en prod
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('odontoapp_refresh', refresh)
  }
}

export function getAccessToken() { return accessToken }
export function clearTokens() {
  accessToken = null
  refreshToken = null
  if (typeof window !== 'undefined') sessionStorage.removeItem('odontoapp_refresh')
}

// Restaurar refresh token al recargar página
if (typeof window !== 'undefined') {
  refreshToken = sessionStorage.getItem('odontoapp_refresh')
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Inyectar token en cada request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Refresh automático si recibe 401
let isRefreshing = false
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry && refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
          userId: '', // se extrae del JWT en el servidor
        })
        const newToken = res.data.accessToken
        accessToken = newToken
        pendingQueue.forEach((p) => p.resolve(newToken))
        pendingQueue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        pendingQueue.forEach((p) => p.reject(error))
        pendingQueue = []
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// Tipos de respuesta comunes
export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface ApiError {
  statusCode: number
  error: string
  message: string | string[]
  timestamp: string
  path: string
}
