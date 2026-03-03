import { apiFetch } from './client'
import { throwApiError } from './errors'

export type RankingType = 'score' | 'match_point'
export type EventType = 'regular' | 'independent'

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
  is_closed: boolean
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
}

export async function createEvent(data: EventCreate): Promise<EventResponse> {
  const res = await apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function listEvents(groupId: number): Promise<EventResponse[]> {
  const res = await apiFetch(`/events?group_id=${groupId}&size=200`)
  if (!res.ok) await throwApiError(res)
  const data: { items: EventResponse[] } = await res.json()
  return data.items
}

export async function getEvent(id: number): Promise<EventResponse> {
  const res = await apiFetch(`/events/${id}`)
  if (!res.ok) await throwApiError(res)
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
}

export async function updateEvent(id: number, data: EventUpdate): Promise<EventResponse> {
  const res = await apiFetch(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function deleteEvent(id: number): Promise<void> {
  const res = await apiFetch(`/events/${id}`, { method: 'DELETE' })
  if (!res.ok) await throwApiError(res)
}

export async function closeEvent(id: number): Promise<EventResponse> {
  const res = await apiFetch(`/events/${id}/close`, { method: 'POST' })
  if (!res.ok) await throwApiError(res)
  return res.json()
}
