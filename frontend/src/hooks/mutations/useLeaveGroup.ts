import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { leaveGroup } from '../../api/groups'

export function useLeaveGroup(groupId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('모임에서 탈퇴했습니다')
      navigate('/', { replace: true })
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
