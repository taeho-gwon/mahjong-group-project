import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateMemberNickname } from '../../api/groups'
import { ApiError } from '../../api/errors'

export function useUpdateMemberNickname(groupId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, nickname }: { userId: number; nickname: string | null }) =>
      updateMemberNickname(groupId, userId, nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      toast.success('닉네임이 변경됐습니다')
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
