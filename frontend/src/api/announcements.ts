import { apiFetch } from './client'

export interface Announcement {
  id: number
  title: string
  content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AnnouncementListResponse {
  items: Announcement[]
  total: number
}

export async function getAnnouncements(page = 1, size = 5): Promise<AnnouncementListResponse> {
  const res = await apiFetch(`/announcements?page=${page}&size=${size}`)
  if (!res.ok) throw new Error('Failed to fetch announcements')
  return res.json()
}
