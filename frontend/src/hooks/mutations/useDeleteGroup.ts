import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteGroup } from '../../api/groups'

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
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
