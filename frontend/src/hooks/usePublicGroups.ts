import { useQuery } from '@tanstack/react-query'
import { getPublicGroups } from '../api/groups'

const PAGE_SIZE = 10

export function usePublicGroups(page: number) {
  return useQuery({
    queryKey: ['publicGroups', page],
    queryFn: () => getPublicGroups(page, PAGE_SIZE),
  })
}
