import { useQuery } from '@tanstack/react-query'
import { getGroupRanking } from '../api/groups'

export function useGroupRanking(
  groupId: number | undefined,
  period?: string,
  offset?: number,
) {
  return useQuery({
    queryKey: ['groupRanking', groupId, period, offset],
    queryFn: () => getGroupRanking(groupId!, period, offset),
    enabled: groupId !== undefined,
  })
}
