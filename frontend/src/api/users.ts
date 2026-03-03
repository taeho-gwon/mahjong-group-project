import { apiFetch } from './client'
import { throwApiError } from './errors'

export interface SharedGroupInfo {
  id: number
  name: string
}

export interface UserProfile {
  id: number
  username: string
  nickname: string | null
  created_at: string
  shared_groups: SharedGroupInfo[]
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const res = await apiFetch(`/users/${userId}`)
  if (!res.ok) await throwApiError(res)
  return res.json()
}
