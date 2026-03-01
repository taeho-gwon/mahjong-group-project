import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteGameRecord } from '../../api/gameRecords'

export function useDeleteGameRecord(contestId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recordId: number) => deleteGameRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'contest', contestId] })
      toast.success('게임 기록이 삭제됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
