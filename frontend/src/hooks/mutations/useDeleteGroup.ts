import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteGroup } from '../../api/groups'
import { ApiError } from '../../api/errors'

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      queryClient.invalidateQueries({ queryKey: ['publicGroups'] })
      toast.success('모임이 삭제됐습니다')
      navigate('/', { replace: true })
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
