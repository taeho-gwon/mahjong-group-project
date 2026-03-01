import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateMemberRole } from '../../api/groups'

export function useUpdateMemberRole(groupId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'admin' | 'member' }) =>
      updateMemberRole(groupId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    },
  })
}
