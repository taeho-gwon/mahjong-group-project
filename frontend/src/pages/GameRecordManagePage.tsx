import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Spinner from '../components/Spinner'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useGroupGameRecords } from '../hooks/useGroupGameRecords'
import { useContests } from '../hooks/useContests'
import { useMe } from '../hooks/useMe'
import { deleteGameRecord } from '../api/gameRecords'

export default function GameRecordManagePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const id = groupId ? Number(groupId) : undefined

  const { data: group, isLoading: loadingGroup } = useGroupDetail(id)
  const { data: me } = useMe()
  const { data: records = [], isLoading: loadingRecords } = useGroupGameRecords(id)
  const { data: contests = [] } = useContests(id)

  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: (recordId: number) => deleteGameRecord(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameRecords', 'group', id] })
      toast.success('게임 기록이 삭제됐습니다')
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  })

  const myRole = group && me ? (group.members.find((m) => m.id === me.id)?.role ?? null) : null
  const isAuthorized = myRole === 'owner' || myRole === 'admin'
  const isLoading = loadingGroup || (!!id && loadingRecords)
  const contestMap = new Map(contests.map((c) => [c.id, c.name]))
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  )

  async function handleDelete(recordId: number) {
    if (!window.confirm('이 게임 기록을 삭제하시겠습니까?')) return
    await deleteMutation.mutateAsync(recordId)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">기록 관리{group ? `: ${group.name}` : ''}</h2>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !isAuthorized ? (
        <p className="text-red-600">접근 권한이 없습니다. Owner 또는 Admin만 접근할 수 있습니다.</p>
      ) : sortedRecords.length === 0 ? (
        <p className="text-sm text-gray-400">아직 게임 기록이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 text-gray-600 text-[13px]">
                <th className="px-2.5 py-2 text-left whitespace-nowrap">날짜</th>
                <th className="px-2.5 py-2 text-left whitespace-nowrap">컨테스트</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">동</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">남</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">서</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">북</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">수정</th>
                <th className="px-2.5 py-2 text-center whitespace-nowrap">삭제</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((rec) => (
                <tr key={rec.id} className="border-b border-gray-100">
                  <td className="px-2.5 py-2.5 align-middle whitespace-nowrap text-xs text-gray-600">
                    {new Date(rec.played_at).toLocaleDateString()}
                  </td>
                  <td className="px-2.5 py-2.5 align-middle whitespace-nowrap text-xs text-gray-600">
                    {rec.contest_id ? (contestMap.get(rec.contest_id) ?? `#${rec.contest_id}`) : '없음'}
                  </td>
                  {[
                    { player: rec.east_player, point: rec.east_point },
                    { player: rec.south_player, point: rec.south_point },
                    { player: rec.west_player, point: rec.west_point },
                    { player: rec.north_player, point: rec.north_point },
                  ].map(({ player, point }, i) => (
                    <td key={i} className="px-2.5 py-2.5 align-middle text-center">
                      <div className="font-medium">{player.username}</div>
                      <div className="text-xs text-gray-500">{point.toLocaleString()}</div>
                    </td>
                  ))}
                  <td className="px-2.5 py-2.5 align-middle text-center">
                    <button
                      onClick={() => navigate(`/game-records/${rec.id}/edit`)}
                      className="text-xs px-2 py-0.5 cursor-pointer bg-transparent border border-gray-400 rounded"
                    >
                      수정
                    </button>
                  </td>
                  <td className="px-2.5 py-2.5 align-middle text-center">
                    <button
                      onClick={() => handleDelete(rec.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs px-2 py-0.5 cursor-pointer text-red-600 bg-transparent border border-red-600 rounded disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
