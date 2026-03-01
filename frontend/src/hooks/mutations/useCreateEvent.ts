import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createEvent } from '../../api/events'
import type { EventCreate } from '../../api/events'

export function useCreateEvent(groupId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EventCreate) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', groupId] })
      toast.success('이벤트가 생성됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
