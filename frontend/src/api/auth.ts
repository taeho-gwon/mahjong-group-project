import { apiFetch } from './client'

const BASE_URL = 'http://localhost:8000'

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

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    throw new Error('Invalid email or password')
  }

  return res.json()
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiFetch('/auth/me')
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}
