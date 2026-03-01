import { useQuery } from '@tanstack/react-query'
import { listContests } from '../api/contests'

export function useContests(groupId: number | undefined) {
  return useQuery({
    queryKey: ['contests', groupId],
    queryFn: () => listContests(groupId!),
    enabled: groupId !== undefined,
  })
}
