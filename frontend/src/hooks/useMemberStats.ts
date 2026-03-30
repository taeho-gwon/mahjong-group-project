import { useQuery } from '@tanstack/react-query'
import { getMemberStats } from '../api/groups'

export function useMemberStats(
  groupId: number | undefined,
  userId: number | undefined,
  eventId?: number,
  period?: string,
  offset?: number,
) {
  return useQuery({
    queryKey: ['memberStats', groupId, userId, eventId, period, offset],
    queryFn: () => getMemberStats(groupId!, userId!, eventId, period, offset),
    enabled: groupId !== undefined && userId !== undefined,
  })
}
