import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createContest } from '../../api/contests'
import type { ContestCreate } from '../../api/contests'

export function useCreateContest(groupId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ContestCreate) => createContest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests', groupId] })
      toast.success('랭킹전이 생성됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
