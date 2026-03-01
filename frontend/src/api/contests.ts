import { apiFetch } from './client'

export type RankingType = 'score' | 'match_point'

export interface ContestResponse {
  id: number
  name: string
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
  created_at: string
  updated_at: string
}

export interface ContestCreate {
  name: string
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

export async function createContest(data: ContestCreate): Promise<ContestResponse> {
  const res = await apiFetch('/contests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create contest')
  return res.json()
}

export async function listContests(groupId: number): Promise<ContestResponse[]> {
  const res = await apiFetch(`/contests?group_id=${groupId}`)
  if (!res.ok) throw new Error('Failed to fetch contests')
  return res.json()
}

export async function getContest(id: number): Promise<ContestResponse> {
  const res = await apiFetch(`/contests/${id}`)
  if (!res.ok) throw new Error('Failed to fetch contest')
  return res.json()
}

export interface ContestUpdate {
  name?: string
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

export async function updateContest(id: number, data: ContestUpdate): Promise<ContestResponse> {
  const res = await apiFetch(`/contests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update contest')
  return res.json()
}

export async function deleteContest(id: number): Promise<void> {
  const res = await apiFetch(`/contests/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete contest')
}
