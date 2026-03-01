import { useQuery } from '@tanstack/react-query'
import { getGroup } from '../api/groups'

export function useGroupDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => getGroup(id!),
    enabled: id !== undefined,
  })
}
