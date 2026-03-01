import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContest } from '../../api/contests'
import type { ContestCreate } from '../../api/contests'

export function useCreateContest(groupId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ContestCreate) => createContest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests', groupId] })
    },
  })
}
