import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createEvent } from '../../api/events'
import type { EventCreate } from '../../api/events'
import { ApiError } from '../../api/errors'

export function useCreateEvent(groupId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EventCreate) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', groupId] })
      toast.success('이벤트가 생성됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
