import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { generateInviteLink } from '../../api/groups'
import { ApiError } from '../../api/errors'

export function useGenerateInviteLink(groupId: number) {
  return useMutation({
    mutationFn: () => generateInviteLink(groupId),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : '오류가 발생했습니다'),
  })
}
