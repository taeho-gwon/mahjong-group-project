import { apiFetch } from './client'

export type RankingType = 'score' | 'match_point'
export type EventType = 'aggregate' | 'regular' | 'independent'
export type PresetType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' | 'custom'

export interface EventResponse {
  id: number
  name: string
  event_type: EventType
  group_id: number | null
  created_by_id: number
  ranking_type: RankingType
  uma_1st: number
  uma_2nd: number
  uma_3rd: number
  uma_4th: number
  scoring_1st: number
  scoring_2nd: number
  scoring_3rd: number
  scoring_4th: number
  period_start: string | null
  period_end: string | null
  is_default: boolean
  is_closed: boolean
  preset_type: PresetType | null
  created_at: string
  updated_at: string
}

export interface EventCreate {
  name: string
  event_type?: EventType
  group_id?: number | null
  ranking_type?: RankingType
  uma_1st: number
  uma_2nd: number
  uma_3rd: number
  uma_4th: number
  scoring_1st?: number
  scoring_2nd?: number
  scoring_3rd?: number
  scoring_4th?: number
  period_start?: string | null
  period_end?: string | null
  preset_type?: PresetType | null
}

export async function createEvent(data: EventCreate): Promise<EventResponse> {
  const res = await apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function listEvents(groupId: number): Promise<EventResponse[]> {
  const res = await apiFetch(`/events?group_id=${groupId}`)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function getEvent(id: number): Promise<EventResponse> {
  const res = await apiFetch(`/events/${id}`)
  if (!res.ok) throw new Error('Failed to fetch event')
  return res.json()
}

export interface EventUpdate {
  name?: string
  event_type?: EventType
  ranking_type?: RankingType
  uma_1st?: number
  uma_2nd?: number
  uma_3rd?: number
  uma_4th?: number
  scoring_1st?: number
  scoring_2nd?: number
  scoring_3rd?: number
  scoring_4th?: number
  period_start?: string | null
  period_end?: string | null
}

export async function updateEvent(id: number, data: EventUpdate): Promise<EventResponse> {
  const res = await apiFetch(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update event')
  return res.json()
}

export async function deleteEvent(id: number): Promise<void> {
  const res = await apiFetch(`/events/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete event')
}

export async function closeEvent(id: number): Promise<EventResponse> {
  const res = await apiFetch(`/events/${id}/close`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to close event')
  return res.json()
}
