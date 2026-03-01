import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { MemberInfo } from '../api/groups'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useContests } from '../hooks/useContests'
import { useCreateGameRecord } from '../hooks/mutations/useCreateGameRecord'

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

export default function GameRecordCreatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const { data: group, isLoading } = useGroupDetail(groupId)
  const { data: contests = [] } = useContests(groupId)

  const members: MemberInfo[] = group?.members ?? []
  const defaultContest = contests.find((c) => c.name === '전체 랭킹') ?? null
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null)

  const effectiveContestId = selectedContestId ?? defaultContest?.id ?? null
  const createGameRecordMutation = useCreateGameRecord(effectiveContestId)

  const [error, setError] = useState('')
  const [positions, setPositions] = useState<Record<Position, PositionState>>({
    east: initPosition(),
    south: initPosition(),
    west: initPosition(),
    north: initPosition(),
  })

  function updatePosition(pos: Position, patch: Partial<PositionState>) {
    setPositions((prev) => ({ ...prev, [pos]: { ...prev[pos], ...patch } }))
  }

  function filteredMembers(pos: Position): MemberInfo[] {
    const search = positions[pos].search.toLowerCase()
    if (!search) return members
    return members.filter((m) => m.username.toLowerCase().includes(search))
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
      await createGameRecordMutation.mutateAsync({
        east_player_id: east.playerId,
        south_player_id: south.playerId,
        west_player_id: west.playerId,
        north_player_id: north.playerId,
        east_point: Number(east.point),
        south_point: Number(south.point),
        west_point: Number(west.point),
        north_point: Number(north.point),
        group_id: groupId,
        contest_id: effectiveContestId,
      })
      navigate(`/groups/${id}`)
    } catch {
      setError('게임 기록 등록에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">게임 등록</h2>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {error && <p className="text-red-600 mb-4">{error}</p>}

          {contests.length > 0 && (
            <div className="mb-5">
              <label className="block font-bold mb-1.5 text-sm">랭킹전 (선택)</label>
              <select
                value={effectiveContestId ?? ''}
                onChange={(e) => setSelectedContestId(e.target.value ? Number(e.target.value) : null)}
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
              >
                <option value="">선택 안 함</option>
                {contests.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

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
                          <option key={m.id} value={m.id}>
                            {m.username}
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

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={createGameRecordMutation.isPending}
              className="px-5 py-2 text-sm cursor-pointer"
            >
              {createGameRecordMutation.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
