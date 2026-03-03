import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateGameRecord } from '../../api/gameRecords'
import type { GameRecordUpdate } from '../../api/gameRecords'
import { ApiError } from '../../api/errors'

export function useUpdateGameRecord(recordId: number, eventId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GameRecordUpdate) => updateGameRecord(recordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameRecord', recordId] })
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'event', eventId] })
      toast.success('게임 기록이 수정됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
