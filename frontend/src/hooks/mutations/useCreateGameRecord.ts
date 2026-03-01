import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createGameRecord } from '../../api/gameRecords'
import type { GameRecordCreate } from '../../api/gameRecords'

export function useCreateGameRecord(eventId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GameRecordCreate) => createGameRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'event', eventId] })
      toast.success('게임 기록이 등록됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
