import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteEvent } from '../../api/events'
import { ApiError } from '../../api/errors'

export function useDeleteEvent(groupId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', groupId] })
      toast.success('이벤트가 삭제됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
