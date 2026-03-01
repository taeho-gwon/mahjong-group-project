import { useAuthStore } from '../stores/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || ''

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  const { refreshToken, setTokens, clearTokens } = useAuthStore.getState()
  if (!refreshToken) {
    clearTokens()
    return false
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = await res.json()
    setTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (res.status === 401 && !path.startsWith('/auth/')) {
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken().finally(() => {
        refreshPromise = null
      })
    }
    const refreshed = await refreshPromise

    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken
      const retryHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string>),
      }
      if (newToken) {
        retryHeaders['Authorization'] = `Bearer ${newToken}`
      }
      return fetch(`${BASE_URL}${path}`, { ...init, headers: retryHeaders })
    }

    window.location.href = '/login'
  }

  return res
}
