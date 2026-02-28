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

export interface GameRecordResponse {
  id: number
  east_player_id: number
  south_player_id: number
  west_player_id: number
  north_player_id: number
  east_point: number
  south_point: number
  west_point: number
  north_point: number
  group_id: number | null
  created_by_id: number
  created_at: string
}

export async function createGameRecord(data: GameRecordCreate): Promise<GameRecordResponse> {
  const res = await apiFetch('/game-records', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create game record')
  return res.json()
}
