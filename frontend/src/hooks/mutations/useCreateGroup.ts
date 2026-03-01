import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createGroup } from '../../api/groups'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      name,
      description,
      join_policy,
    }: {
      name: string
      description?: string
      join_policy: 'public' | 'private'
    }) => createGroup(name, description, join_policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      toast.success('모임이 생성됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
