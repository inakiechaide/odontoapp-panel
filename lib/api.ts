import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const TOKEN_KEY = 'odontoapp_token'
const REFRESH_KEY = 'odontoapp_refresh'

// Tokens en memoria (más rápido) + localStorage (persistencia)
let accessToken: string | null = null
let refreshToken: string | null = null

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem(TOKEN_KEY)
  }
  return accessToken
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }
}

// Restaurar refresh token al cargar
if (typeof window !== 'undefined') {
  refreshToken = localStorage.getItem(REFRESH_KEY)
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// Inyectar token en cada request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh automático si 401
let isRefreshing = false
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      const rf = refreshToken ?? (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null)
      if (rf) {
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
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: rf })
          const newToken = res.data.accessToken
          accessToken = newToken
          if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, newToken)
          // El backend rota el refresh token: guardamos el nuevo para el próximo refresh.
          const newRefresh = res.data.refreshToken
          if (newRefresh) {
            refreshToken = newRefresh
            if (typeof window !== 'undefined') localStorage.setItem(REFRESH_KEY, newRefresh)
          }
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
      } else {
        // Sin refresh token → redirect a login
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}
