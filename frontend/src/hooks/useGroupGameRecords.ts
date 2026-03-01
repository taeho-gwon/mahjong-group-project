import { useQuery } from '@tanstack/react-query'
import { listGameRecords } from '../api/gameRecords'
import type { GameRecordResponse } from '../api/gameRecords'

async function fetchAllGroupGameRecords(groupId: number): Promise<GameRecordResponse[]> {
  const PAGE_SIZE = 100
  const first = await listGameRecords(groupId, 1, PAGE_SIZE)
  const results = [...first.items]
  const totalPages = Math.ceil(first.total / PAGE_SIZE)
  for (let page = 2; page <= totalPages; page++) {
    const res = await listGameRecords(groupId, page, PAGE_SIZE)
    results.push(...res.items)
  }
  return results
}

export function useGroupGameRecords(groupId: number | undefined) {
  return useQuery({
    queryKey: ['gameRecords', 'group', groupId],
    queryFn: () => fetchAllGroupGameRecords(groupId!),
    enabled: groupId !== undefined,
  })
}
