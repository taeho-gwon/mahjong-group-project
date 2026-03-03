import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createGroup } from '../../api/groups'
import { ApiError } from '../../api/errors'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      name: string
      description?: string | null
      join_policy: 'public' | 'private'
      weekly_start_day?: number
      monthly_start_day?: number
    }) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      toast.success('모임이 생성됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
