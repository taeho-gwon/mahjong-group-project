import { apiFetch } from './client'

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
  if (!res.ok) throw new Error('Failed to create game record')
  return res.json()
}

export async function listGameRecords(
  groupId: number,
  page = 1,
  size = 200,
): Promise<PaginatedGameRecordResponse> {
  const res = await apiFetch(`/game-records?group_id=${groupId}&page=${page}&size=${size}`)
  if (!res.ok) throw new Error('Failed to fetch game records')
  return res.json()
}
