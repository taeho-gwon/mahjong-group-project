import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateContest } from '../../api/contests'
import type { ContestUpdate } from '../../api/contests'

export function useUpdateContest(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ContestUpdate) => updateContest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest', id] })
      toast.success('랭킹전이 수정됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
