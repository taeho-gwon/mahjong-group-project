import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createGameRecord } from '../../api/gameRecords'
import type { GameRecordCreate } from '../../api/gameRecords'
import { ApiError } from '../../api/errors'

export function useCreateGameRecord(groupId: number | undefined, eventId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GameRecordCreate) => createGameRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'group', groupId] })
      toast.success('게임 기록이 등록됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
