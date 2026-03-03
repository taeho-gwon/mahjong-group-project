import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { joinGroup } from '../../api/groups'
import { ApiError } from '../../api/errors'

export function useJoinGroup() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: ({ groupId, nickname }: { groupId: number; nickname?: string | null }) =>
      joinGroup(groupId, nickname),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
      queryClient.invalidateQueries({ queryKey: ['publicGroups'] })
      toast.success('모임에 가입했습니다')
      navigate(`/groups/${groupId}`)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isConflict) {
        toast.error('이미 사용 중인 닉네임입니다')
      } else {
        toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다')
      }
    },
  })
}
