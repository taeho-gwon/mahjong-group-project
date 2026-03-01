import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteContest } from '../../api/contests'

export function useDeleteContest(groupId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteContest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests', groupId] })
      toast.success('랭킹전이 삭제됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
