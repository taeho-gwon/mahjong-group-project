import { apiFetch } from './client'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserResponse {
  id: number
  username: string
  email: string
  is_active: boolean
  created_at: string
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    throw new Error('Invalid username or password')
  }

  return res.json()
}

export async function register(username: string, password: string): Promise<UserResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail ?? 'Registration failed')
  }

  return res.json()
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiFetch('/auth/me')
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}
