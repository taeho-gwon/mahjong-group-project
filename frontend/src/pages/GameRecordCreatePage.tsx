import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroup } from '../api/groups'
import type { MemberInfo } from '../api/groups'
import { createGameRecord } from '../api/gameRecords'
import { listContests } from '../api/contests'
import type { ContestResponse } from '../api/contests'

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
  const [members, setMembers] = useState<MemberInfo[]>([])
  const [contests, setContests] = useState<ContestResponse[]>([])
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [positions, setPositions] = useState<Record<Position, PositionState>>({
    east: initPosition(),
    south: initPosition(),
    west: initPosition(),
    north: initPosition(),
  })

  useEffect(() => {
    if (!id) return
    Promise.all([getGroup(Number(id)), listContests(Number(id))])
      .then(([g, contestList]) => {
        setMembers(g.members)
        setContests(contestList)
        const totalContest = contestList.find((c) => c.name === '전체 랭킹')
        if (totalContest) setSelectedContestId(totalContest.id)
      })
      .catch(() => setError('Failed to load group members'))
      .finally(() => setLoading(false))
  }, [id])

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
    setSubmitting(true)
    try {
      await createGameRecord({
        east_player_id: east.playerId,
        south_player_id: south.playerId,
        west_player_id: west.playerId,
        north_player_id: north.playerId,
        east_point: Number(east.point),
        south_point: Number(south.point),
        west_point: Number(west.point),
        north_point: Number(north.point),
        group_id: id ? Number(id) : undefined,
        contest_id: selectedContestId,
      })
      navigate(`/groups/${id}`)
    } catch {
      setError('게임 기록 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: '0 0 0 16px' }}>게임 등록</h2>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

          {contests.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>랭킹전 (선택)</label>
              <select
                value={selectedContestId ?? ''}
                onChange={(e) => setSelectedContestId(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '14px' }}
              >
                <option value="">선택 안 함</option>
                {contests.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr>
                <th style={thStyle}>포지션</th>
                <th style={thStyle}>이름 검색</th>
                <th style={thStyle}>플레이어 선택</th>
                <th style={thStyle}>점수</th>
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map(({ key, label }) => {
                const pos = positions[key]
                const filtered = filteredMembers(key)
                return (
                  <tr key={key}>
                    <td style={tdStyle}>
                      <strong>{label}</strong>
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="text"
                        value={pos.search}
                        onChange={(e) => updatePosition(key, { search: e.target.value, playerId: null })}
                        placeholder="이름 검색"
                        style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={pos.playerId ?? ''}
                        onChange={(e) => updatePosition(key, { playerId: e.target.value ? Number(e.target.value) : null })}
                        style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
                      >
                        <option value="">-- 선택 --</option>
                        {filtered.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.username}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        value={pos.point}
                        onChange={(e) => updatePosition(key, { point: e.target.value })}
                        placeholder="점수"
                        style={{ width: '80px', padding: '6px', boxSizing: 'border-box' }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ padding: '8px 20px', fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '2px solid #ccc',
  fontSize: '13px',
  color: '#555',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'middle',
  borderBottom: '1px solid #eee',
}
