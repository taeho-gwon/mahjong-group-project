import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateGroup } from '../../api/groups'
import { ApiError } from '../../api/errors'

export function useUpdateGroup(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateGroup>[1]) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] })
      toast.success('모임 설정이 저장됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
