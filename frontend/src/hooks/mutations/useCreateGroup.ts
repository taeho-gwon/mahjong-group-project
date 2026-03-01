import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup } from '../../api/groups'

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      name,
      description,
      join_policy,
      uma,
    }: {
      name: string
      description?: string
      join_policy: 'public' | 'private'
      uma?: { uma_1st: number; uma_2nd: number; uma_3rd: number; uma_4th: number }
    }) => createGroup(name, description, join_policy, uma),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] })
    },
  })
}
