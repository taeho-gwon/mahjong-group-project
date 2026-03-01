import { useQuery } from '@tanstack/react-query'
import { getEvent } from '../api/events'

export function useEvent(id: number | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: id !== undefined,
  })
}
