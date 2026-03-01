import { useQuery } from '@tanstack/react-query'
import { getMyGroups } from '../api/groups'

export function useMyGroups() {
  return useQuery({
    queryKey: ['myGroups'],
    queryFn: getMyGroups,
  })
}
