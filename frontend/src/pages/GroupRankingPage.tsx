import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroup } from '../api/groups'
import type { GroupDetailResponse } from '../api/groups'
import { listGameRecords } from '../api/gameRecords'
import type { GameRecordResponse } from '../api/gameRecords'

async function fetchAllGameRecords(groupId: number): Promise<GameRecordResponse[]> {
  const PAGE_SIZE = 50
  const first = await listGameRecords(groupId, 1, PAGE_SIZE)
  const results = [...first.items]
  const totalPages = Math.ceil(first.total / PAGE_SIZE)
  for (let page = 2; page <= totalPages; page++) {
    const res = await listGameRecords(groupId, page, PAGE_SIZE)
    results.push(...res.items)
  }
  return results
}

interface RankingEntry {
  id: number
  username: string
  totalScore: number
  rankCounts: [number, number, number, number]
  gameCount: number
}

function computeRanking(group: GroupDetailResponse, records: GameRecordResponse[]): RankingEntry[] {
  const umaByRank = [group.uma_1st, group.uma_2nd, group.uma_3rd, group.uma_4th]
  const playerMap = new Map<number, RankingEntry>()

  for (const rec of records) {
    const seats = [
      { player: rec.east_player, point: rec.east_point },
      { player: rec.south_player, point: rec.south_point },
      { player: rec.west_player, point: rec.west_point },
      { player: rec.north_player, point: rec.north_point },
    ]
    seats.sort((a, b) => b.point - a.point)
    seats.forEach(({ player, point }, rank) => {
      const entry = playerMap.get(player.id) ?? {
        id: player.id,
        username: player.username,
        totalScore: 0,
        rankCounts: [0, 0, 0, 0],
        gameCount: 0,
      }
      entry.totalScore += (point - 25000) / 1000 + umaByRank[rank]
      entry.rankCounts[rank] += 1
      entry.gameCount += 1
      playerMap.set(player.id, entry)
    })
  }

  return [...playerMap.values()].sort((a, b) => b.totalScore - a.totalScore)
}

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([getGroup(Number(id)), fetchAllGameRecords(Number(id))])
      .then(([g, allRecords]) => {
        setGroup(g)
        setRanking(computeRanking(g, allRecords))
      })
      .catch(() => setError('Failed to load ranking'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: '0 0 0 16px' }}>전체 랭킹</h2>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : group ? (
        <>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
            <strong>우마:</strong>{' '}
            {[group.uma_1st, group.uma_2nd, group.uma_3rd, group.uma_4th]
              .map((v, i) => `${i + 1}위 ${v > 0 ? '+' : ''}${v}`)
              .join(' / ')}
          </div>

          {ranking.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>아직 게임 기록이 없습니다.</p>
          ) : (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ranking.map((entry, idx) => (
                <li
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '14px',
                  }}
                >
                  <span style={{ width: '24px', textAlign: 'right', fontWeight: 'bold', color: '#666' }}>{idx + 1}</span>
                  <span style={{ flex: 1 }}>{entry.username}</span>
                  <span style={{ color: entry.totalScore >= 0 ? '#2d7a3a' : '#c0392b', fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>
                    {entry.totalScore > 0 ? '+' : ''}{entry.totalScore % 1 === 0 ? entry.totalScore : entry.totalScore.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#888', minWidth: '80px', textAlign: 'right' }}>
                    {entry.rankCounts.map((c, i) => `${i + 1}위×${c}`).join(' ')}
                  </span>
                  <span style={{ color: '#aaa', fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>
                    {entry.gameCount}게임
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : null}
    </div>
  )
}
