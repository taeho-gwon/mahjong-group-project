import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateEvent } from '../../api/events'
import type { EventUpdate } from '../../api/events'
import { ApiError } from '../../api/errors'

export function useUpdateEvent(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EventUpdate) => updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      toast.success('이벤트가 수정됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
