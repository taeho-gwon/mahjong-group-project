import { useQuery } from '@tanstack/react-query'
import { listGameRecords } from '../api/gameRecords'
import type { GameRecordResponse } from '../api/gameRecords'

async function fetchAllGameRecords(eventId: number): Promise<GameRecordResponse[]> {
  const PAGE_SIZE = 50
  const first = await listGameRecords(undefined, 1, PAGE_SIZE, eventId)
  const results = [...first.items]
  const totalPages = Math.ceil(first.total / PAGE_SIZE)
  for (let page = 2; page <= totalPages; page++) {
    const res = await listGameRecords(undefined, page, PAGE_SIZE, eventId)
    results.push(...res.items)
  }
  return results
}

export function useEventGameRecords(eventId: number | undefined) {
  return useQuery({
    queryKey: ['gameRecords', 'event', eventId],
    queryFn: () => fetchAllGameRecords(eventId!),
    enabled: eventId !== undefined,
  })
}
