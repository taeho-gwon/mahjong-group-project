import { useQuery } from '@tanstack/react-query'
import { getGameRecord } from '../api/gameRecords'

export function useGameRecord(id: number | undefined) {
  return useQuery({
    queryKey: ['gameRecord', id],
    queryFn: () => getGameRecord(id!),
    enabled: id !== undefined,
  })
}
