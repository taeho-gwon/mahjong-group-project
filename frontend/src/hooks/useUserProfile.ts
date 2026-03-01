import { useQuery } from '@tanstack/react-query'
import { getUserProfile } from '../api/users'

export function useUserProfile(userId: number | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: userId !== undefined,
  })
}
