import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGameRecord } from '../../api/gameRecords'
import type { GameRecordCreate } from '../../api/gameRecords'

export function useCreateGameRecord(contestId: number | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: GameRecordCreate) => createGameRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'contest', contestId] })
    },
  })
}
