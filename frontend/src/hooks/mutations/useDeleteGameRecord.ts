import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteGameRecord } from '../../api/gameRecords'
import { ApiError } from '../../api/errors'

export function useDeleteGameRecord(groupId: number | undefined, eventId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recordId: number) => deleteGameRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'group', groupId] })
      toast.success('게임 기록이 삭제됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
