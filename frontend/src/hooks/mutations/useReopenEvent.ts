import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reopenEvent } from '../../api/events'
import { ApiError } from '../../api/errors'

export function useReopenEvent(groupId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: number) => reopenEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', groupId] })
      toast.success('이벤트가 재개되었습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
