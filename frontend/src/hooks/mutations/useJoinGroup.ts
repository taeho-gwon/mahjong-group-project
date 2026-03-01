import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { joinGroup } from '../../api/groups'

export function useJoinGroup() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (groupId: number) => joinGroup(groupId),
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      queryClient.invalidateQueries({ queryKey: ['publicGroups'] })
      toast.success('그룹에 가입했습니다')
      navigate(`/groups/${groupId}`)
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })
}
