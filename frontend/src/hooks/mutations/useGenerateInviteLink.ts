import { useMutation } from '@tanstack/react-query'
import { generateInviteLink } from '../../api/groups'

export function useGenerateInviteLink(groupId: number) {
  return useMutation({
    mutationFn: () => generateInviteLink(groupId),
  })
}
