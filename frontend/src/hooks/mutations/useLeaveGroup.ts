import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { leaveGroup } from '../../api/groups'
import { ApiError } from '../../api/errors'

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
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
