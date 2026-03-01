import { useQuery } from '@tanstack/react-query'
import { getContest } from '../api/contests'

export function useContest(id: number | undefined) {
  return useQuery({
    queryKey: ['contest', id],
    queryFn: () => getContest(id!),
    enabled: id !== undefined,
  })
}
