import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { removeMember } from '../../api/groups'

export function useRemoveMember(groupId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('멤버가 강퇴됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
