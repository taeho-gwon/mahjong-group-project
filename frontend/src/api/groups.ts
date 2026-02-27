import { apiFetch } from './client'

export interface GroupResponse {
  id: number
  name: string
  description: string | null
  owner_id: number
  is_active: boolean
  created_at: string
}

export async function getGroups(): Promise<GroupResponse[]> {
  const res = await apiFetch('/groups')
  if (!res.ok) throw new Error('Failed to fetch groups')
  return res.json()
}

export async function createGroup(name: string, description?: string): Promise<GroupResponse> {
  const res = await apiFetch('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description: description || null }),
  })
  if (!res.ok) throw new Error('Failed to create group')
  return res.json()
}
