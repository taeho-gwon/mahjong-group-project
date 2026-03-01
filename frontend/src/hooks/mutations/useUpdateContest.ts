import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateContest } from '../../api/contests'
import type { ContestUpdate } from '../../api/contests'

export function useUpdateContest(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ContestUpdate) => updateContest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest', id] })
    },
  })
}
