import { apiFetch } from './client'
import { throwApiError } from './errors'

export interface Announcement {
  id: number
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getAnnouncements(page = 1, size = 5): Promise<Announcement[]> {
  const res = await apiFetch(`/announcements?page=${page}&size=${size}`)
  if (!res.ok) await throwApiError(res)
  return res.json()
}
