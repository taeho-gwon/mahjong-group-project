import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGroup } from '../../api/groups'

export function useUpdateGroup(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof updateGroup>[1]) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] })
    },
  })
}
