import { useQuery } from '@tanstack/react-query'
import { listGameRecords } from '../api/gameRecords'

export function useEventGameRecordCount(eventId: number | undefined) {
  return useQuery({
    queryKey: ['gameRecords', 'event', eventId, 'count'],
    queryFn: async () => {
      const res = await listGameRecords(undefined, 1, 1, eventId!)
      return res.total
    },
    enabled: eventId !== undefined,
  })
}
