import { useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import ConfirmModal from '../components/ConfirmModal'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useGroupGameRecords } from '../hooks/useGroupGameRecords'
import { useEvents } from '../hooks/useEvents'
import { useMe } from '../hooks/useMe'
import { useDeleteGameRecord } from '../hooks/mutations/useDeleteGameRecord'
import { getDisplayName } from '../api/groups'
import { ApiError } from '../api/errors'

export default function GameRecordManagePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const id = groupId ? Number(groupId) : undefined

  const { data: group, isLoading: loadingGroup, isError, error } = useGroupDetail(id)
  const { data: me } = useMe()
  const { data: records = [], isLoading: loadingRecords } = useGroupGameRecords(id)
  const { data: events = [] } = useEvents(id)

  const deleteMutation = useDeleteGameRecord(id, undefined)

  const myRole = group && me ? (group.members.find((m) => m.id === me.id)?.role ?? null) : null
  const isAuthorized = myRole === 'owner' || myRole === 'admin'
  const isLoading = loadingGroup || (!!id && loadingRecords)
  const eventMap = new Map(events.map((c) => [c.id, c.name]))
  const nameMap = new Map(group ? group.members.map((m) => [m.id, getDisplayName(m)]) : [])
  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  )

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  async function handleDelete() {
    if (deleteTargetId == null) return
    setDeleteTargetId(null)
    await deleteMutation.mutateAsync(deleteTargetId)
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
      ) : isError ? (
        error instanceof ApiError && error.isNotFound ? (
          <Navigate to="/not-found" replace />
        ) : (
          <p className="mt-6 text-red-600 dark:text-red-400">모임 정보를 불러올 수 없습니다.</p>
        )
      ) : !isAuthorized ? (
        <p className="text-red-600 dark:text-red-400">접근 권한이 없습니다. Owner 또는 Admin만 접근할 수 있습니다.</p>
      ) : sortedRecords.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">아직 게임 기록이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-[13px]">
                <th className="px-2.5 py-2 text-center whitespace-nowrap">#</th>
                <th className="px-2.5 py-2 text-left whitespace-nowrap">날짜</th>
                <th className="px-2.5 py-2 text-left whitespace-nowrap">이벤트</th>
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
                <tr key={rec.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-2.5 py-2.5 align-middle text-center whitespace-nowrap text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {rec.id}
                  </td>
                  <td className="px-2.5 py-2.5 align-middle whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                    {new Date(rec.played_at).toLocaleDateString()}
                  </td>
                  <td className="px-2.5 py-2.5 align-middle whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                    {rec.event_id ? (eventMap.get(rec.event_id) ?? `#${rec.event_id}`) : '전체 (미지정)'}
                  </td>
                  {[
                    { player: rec.east_player, point: rec.east_point },
                    { player: rec.south_player, point: rec.south_point },
                    { player: rec.west_player, point: rec.west_point },
                    { player: rec.north_player, point: rec.north_point },
                  ].map(({ player, point }, i) => (
                    <td key={i} className="px-2.5 py-2.5 align-middle text-center">
                      <div className="font-medium">{nameMap.get(player.id) ?? player.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{point.toLocaleString()}</div>
                    </td>
                  ))}
                  <td className="px-2.5 py-2.5 align-middle text-center">
                    <button
                      onClick={() => navigate(`/game-records/${rec.id}/edit`)}
                      className="text-xs px-2 py-0.5 cursor-pointer bg-transparent border border-gray-400 dark:border-gray-500 rounded dark:text-gray-300"
                    >
                      수정
                    </button>
                  </td>
                  <td className="px-2.5 py-2.5 align-middle text-center">
                    <button
                      onClick={() => setDeleteTargetId(rec.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs px-2 py-0.5 cursor-pointer text-red-600 dark:text-red-400 bg-transparent border border-red-600 dark:border-red-500 rounded disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={deleteTargetId != null}
        title="게임 기록 삭제"
        description="이 게임 기록을 삭제하시겠습니까?"
        confirmLabel="삭제"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
        destructive
      />
    </div>
  )
}
