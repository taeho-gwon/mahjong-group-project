import { useQuery } from '@tanstack/react-query'
import { listEvents } from '../api/events'

export function useEvents(groupId: number | undefined) {
  return useQuery({
    queryKey: ['events', groupId],
    queryFn: () => listEvents(groupId!),
    enabled: groupId !== undefined,
  })
}
