import { useQuery } from '@tanstack/react-query'
import { listGameRecords } from '../api/gameRecords'
import type { GameRecordResponse } from '../api/gameRecords'

async function fetchAllGameRecords(contestId: number): Promise<GameRecordResponse[]> {
  const PAGE_SIZE = 50
  const first = await listGameRecords(undefined, 1, PAGE_SIZE, contestId)
  const results = [...first.items]
  const totalPages = Math.ceil(first.total / PAGE_SIZE)
  for (let page = 2; page <= totalPages; page++) {
    const res = await listGameRecords(undefined, page, PAGE_SIZE, contestId)
    results.push(...res.items)
  }
  return results
}

export function useContestGameRecords(contestId: number | undefined) {
  return useQuery({
    queryKey: ['gameRecords', 'contest', contestId],
    queryFn: () => fetchAllGameRecords(contestId!),
    enabled: contestId !== undefined,
  })
}
