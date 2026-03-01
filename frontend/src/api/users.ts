import { apiFetch } from './client'

export interface SharedGroupInfo {
  id: number
  name: string
}

export interface UserProfile {
  id: number
  username: string
  created_at: string
  shared_groups: SharedGroupInfo[]
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const res = await apiFetch(`/users/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch user profile')
  return res.json()
}
