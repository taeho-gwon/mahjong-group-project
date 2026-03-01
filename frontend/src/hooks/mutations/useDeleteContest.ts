import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteContest } from '../../api/contests'

export function useDeleteContest(groupId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteContest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests', groupId] })
    },
  })
}
