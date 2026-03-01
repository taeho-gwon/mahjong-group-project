import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { closeEvent } from '../../api/events'

export function useCloseEvent(groupId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: number) => closeEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', groupId] })
      toast.success('이벤트가 마감됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
