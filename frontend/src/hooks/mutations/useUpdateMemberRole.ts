import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateMemberRole } from '../../api/groups'
import { ApiError } from '../../api/errors'

export function useUpdateMemberRole(groupId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'admin' | 'member' }) =>
      updateMemberRole(groupId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('멤버 역할이 변경됐습니다')
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
