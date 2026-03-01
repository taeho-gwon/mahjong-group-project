import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MemberInfo } from '../api/groups'
import Spinner from '../components/Spinner'
import { useGameRecord } from '../hooks/useGameRecord'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useUpdateGameRecord } from '../hooks/mutations/useUpdateGameRecord'

const POSITIONS = [
  { key: 'east', label: '동' },
  { key: 'south', label: '남' },
  { key: 'west', label: '서' },
  { key: 'north', label: '북' },
] as const

type Position = (typeof POSITIONS)[number]['key']

interface PositionState {
  search: string
  playerId: number | null
  point: string
}

function initPosition(): PositionState {
  return { search: '', playerId: null, point: '' }
}

export default function GameRecordEditPage() {
  const { recordId } = useParams<{ recordId: string }>()
  const navigate = useNavigate()
  const id = recordId ? Number(recordId) : undefined

  const { data: record, isLoading: loadingRecord } = useGameRecord(id)
  const { data: group, isLoading: loadingGroup } = useGroupDetail(record?.group_id ?? undefined)

  const updateMutation = useUpdateGameRecord(id!, record?.event_id)

  const members: MemberInfo[] = group?.members ?? []
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [positions, setPositions] = useState<Record<Position, PositionState>>({
    east: initPosition(),
    south: initPosition(),
    west: initPosition(),
    north: initPosition(),
  })

  useEffect(() => {
    if (!record || initialized) return
    setPositions({
      east: { search: '', playerId: record.east_player_id, point: String(record.east_point) },
      south: { search: '', playerId: record.south_player_id, point: String(record.south_point) },
      west: { search: '', playerId: record.west_player_id, point: String(record.west_point) },
      north: { search: '', playerId: record.north_player_id, point: String(record.north_point) },
    })
    setInitialized(true)
  }, [record, initialized])

  function updatePosition(pos: Position, patch: Partial<PositionState>) {
    setPositions((prev) => ({ ...prev, [pos]: { ...prev[pos], ...patch } }))
  }

  function selectedPlayerIds(excludePos: Position): Set<number> {
    const ids = new Set<number>()
    for (const { key } of POSITIONS) {
      if (key !== excludePos && positions[key].playerId != null) {
        ids.add(positions[key].playerId!)
      }
    }
    return ids
  }

  function filteredMembers(pos: Position): MemberInfo[] {
    const search = positions[pos].search.toLowerCase()
    if (!search) return members
    return members.filter((m) => m.username.toLowerCase().includes(search))
  }

  function hasDuplicatePlayers(): boolean {
    const ids = POSITIONS.map(({ key }) => positions[key].playerId).filter((id) => id != null)
    return new Set(ids).size !== ids.length
  }

  async function handleSubmit() {
    const east = positions.east
    const south = positions.south
    const west = positions.west
    const north = positions.north

    if (!east.playerId || !south.playerId || !west.playerId || !north.playerId) {
      setError('모든 포지션에 플레이어를 선택하세요.')
      return
    }
    if (!east.point || !south.point || !west.point || !north.point) {
      setError('모든 포지션의 점수를 입력하세요.')
      return
    }

    setError('')
    try {
      await updateMutation.mutateAsync({
        east_player_id: east.playerId,
        south_player_id: south.playerId,
        west_player_id: west.playerId,
        north_player_id: north.playerId,
        east_point: Number(east.point),
        south_point: Number(south.point),
        west_point: Number(west.point),
        north_point: Number(north.point),
      })
      navigate(-1)
    } catch {
      setError('게임 기록 수정에 실패했습니다.')
    }
  }

  const isLoading = loadingRecord || (!!record?.group_id && loadingGroup)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">게임 기록 수정</h2>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <table className="w-full border-collapse mb-6">
            <thead>
              <tr>
                <th className="text-left px-2.5 py-2 border-b-2 border-gray-300 text-[13px] text-gray-600">포지션</th>
                <th className="text-left px-2.5 py-2 border-b-2 border-gray-300 text-[13px] text-gray-600">이름 검색</th>
                <th className="text-left px-2.5 py-2 border-b-2 border-gray-300 text-[13px] text-gray-600">플레이어 선택</th>
                <th className="text-left px-2.5 py-2 border-b-2 border-gray-300 text-[13px] text-gray-600">점수</th>
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map(({ key, label }) => {
                const pos = positions[key]
                const filtered = filteredMembers(key)
                const taken = selectedPlayerIds(key)
                return (
                  <tr key={key}>
                    <td className="px-2.5 py-2 align-middle border-b border-gray-100">
                      <strong>{label}</strong>
                    </td>
                    <td className="px-2.5 py-2 align-middle border-b border-gray-100">
                      <input
                        type="text"
                        value={pos.search}
                        onChange={(e) => updatePosition(key, { search: e.target.value, playerId: null })}
                        placeholder="이름 검색"
                        className="border border-gray-300 rounded px-1.5 py-1.5 w-full"
                      />
                    </td>
                    <td className="px-2.5 py-2 align-middle border-b border-gray-100">
                      <select
                        value={pos.playerId ?? ''}
                        onChange={(e) => updatePosition(key, { playerId: e.target.value ? Number(e.target.value) : null })}
                        className="border border-gray-300 rounded px-1.5 py-1.5 w-full"
                      >
                        <option value="">-- 선택 --</option>
                        {filtered.map((m) => (
                          <option key={m.id} value={m.id} disabled={taken.has(m.id)}>
                            {m.username}{taken.has(m.id) ? ' (선택됨)' : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2.5 py-2 align-middle border-b border-gray-100">
                      <input
                        type="number"
                        value={pos.point}
                        onChange={(e) => updatePosition(key, { point: e.target.value })}
                        placeholder="점수"
                        className="border border-gray-300 rounded px-1.5 py-1.5 w-20"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {(() => {
            const pointSum = ['east', 'south', 'west', 'north'].reduce(
              (acc, k) => acc + (Number(positions[k as Position].point) || 0), 0
            )
            const isValidSum = pointSum === 100000
            return (
              <div className="mb-4 text-sm">
                {pointSum === 0 ? null : isValidSum ? (
                  <span className="text-green-700">합계: {pointSum.toLocaleString()} ✅</span>
                ) : (
                  <span className="text-red-600">합계: {pointSum.toLocaleString()} ❌ (100,000이어야 합니다)</span>
                )}
              </div>
            )
          })()}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending || hasDuplicatePlayers() || (['east', 'south', 'west', 'north'] as Position[]).reduce((acc, k) => acc + (Number(positions[k].point) || 0), 0) !== 100000}
              className="px-5 py-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {updateMutation.isPending ? '처리 중...' : '저장'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
