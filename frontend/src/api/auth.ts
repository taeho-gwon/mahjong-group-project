import { apiFetch } from './client'
import { throwApiError } from './errors'

const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api'

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserResponse {
  id: number
  username: string
  nickname: string | null
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
    await throwApiError(res, '아이디 또는 비밀번호가 올바르지 않습니다')
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
    await throwApiError(res, '회원가입에 실패했습니다')
  }

  return res.json()
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiFetch('/auth/me')
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function updateMe(data: { nickname: string | null }): Promise<UserResponse> {
  const res = await apiFetch('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}
