import { apiFetch } from './client'
import { throwApiError } from './errors'

export interface GameRecordCreate {
  east_player_id: number
  south_player_id: number
  west_player_id: number
  north_player_id: number
  east_point: number
  south_point: number
  west_point: number
  north_point: number
  group_id?: number
  event_id?: number | null
}

export interface PlayerInfo {
  id: number
  username: string
}

export interface GameRecordResponse {
  id: number
  east_player_id: number
  south_player_id: number
  west_player_id: number
  north_player_id: number
  east_player: PlayerInfo
  south_player: PlayerInfo
  west_player: PlayerInfo
  north_player: PlayerInfo
  east_point: number
  south_point: number
  west_point: number
  north_point: number
  group_id: number | null
  event_id: number | null
  game_link: string | null
  played_at: string
  created_by_id: number
  created_at: string
}

export interface PaginatedGameRecordResponse {
  items: GameRecordResponse[]
  total: number
  page: number
  size: number
}

export async function createGameRecord(data: GameRecordCreate): Promise<GameRecordResponse> {
  const res = await apiFetch('/game-records', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function getGameRecord(recordId: number): Promise<GameRecordResponse> {
  const res = await apiFetch(`/game-records/${recordId}`)
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export interface GameRecordUpdate {
  east_player_id?: number
  south_player_id?: number
  west_player_id?: number
  north_player_id?: number
  east_point?: number
  south_point?: number
  west_point?: number
  north_point?: number
  game_link?: string | null
  played_at?: string
}

export async function updateGameRecord(recordId: number, data: GameRecordUpdate): Promise<GameRecordResponse> {
  const res = await apiFetch(`/game-records/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function deleteGameRecord(recordId: number): Promise<void> {
  const res = await apiFetch(`/game-records/${recordId}`, { method: 'DELETE' })
  if (!res.ok) await throwApiError(res)
}

export async function listGameRecords(
  groupId?: number,
  page = 1,
  size = 200,
  eventId?: number,
): Promise<PaginatedGameRecordResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (groupId !== undefined) params.set('group_id', String(groupId))
  if (eventId !== undefined) params.set('event_id', String(eventId))
  const res = await apiFetch(`/game-records?${params}`)
  if (!res.ok) await throwApiError(res)
  return res.json()
}
