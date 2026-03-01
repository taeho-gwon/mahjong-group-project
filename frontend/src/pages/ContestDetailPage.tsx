import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContest, deleteContest } from '../api/contests'
import type { ContestResponse } from '../api/contests'
import { getMe } from '../api/auth'
import type { UserResponse } from '../api/auth'
import { listGameRecords } from '../api/gameRecords'
import type { GameRecordResponse } from '../api/gameRecords'

async function fetchAllGameRecords(contestId: number): Promise<GameRecordResponse[]> {
  const PAGE_SIZE = 50
  const first = await listGameRecords(undefined, 1, PAGE_SIZE, contestId)
  const results = [...first.items]
  const totalPages = Math.ceil(first.total / PAGE_SIZE)
  for (let page = 2; page <= totalPages; page++) {
    const res = await listGameRecords(undefined, page, PAGE_SIZE, contestId)
    results.push(...res.items)
  }
  return results
}

interface RankingEntry {
  id: number
  username: string
  totalScore: number
  matchPoint: number
  rankCounts: [number, number, number, number]
  gameCount: number
}

function computeRanking(contest: ContestResponse, records: GameRecordResponse[]): RankingEntry[] {
  const umaByRank = [contest.uma_1st, contest.uma_2nd, contest.uma_3rd, contest.uma_4th]
  const scoringByRank = [contest.scoring_1st, contest.scoring_2nd, contest.scoring_3rd, contest.scoring_4th]

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
        matchPoint: 0,
        rankCounts: [0, 0, 0, 0],
        gameCount: 0,
      }
      entry.totalScore += (point - 25000) / 1000 + umaByRank[rank]
      entry.matchPoint += scoringByRank[rank]
      entry.rankCounts[rank] += 1
      entry.gameCount += 1
      playerMap.set(player.id, entry)
    })
  }

  const entries = [...playerMap.values()]
  if (contest.ranking_type === 'match_point') {
    entries.sort((a, b) => b.matchPoint - a.matchPoint)
  } else {
    entries.sort((a, b) => b.totalScore - a.totalScore)
  }
  return entries
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 10px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
}

export default function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>()
  const navigate = useNavigate()

  const [contest, setContest] = useState<ContestResponse | null>(null)
  const [me, setMe] = useState<UserResponse | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!contestId) return
    Promise.all([getContest(Number(contestId)), getMe(), fetchAllGameRecords(Number(contestId))])
      .then(([c, user, records]) => {
        setContest(c)
        setMe(user)
        setRanking(computeRanking(c, records))
      })
      .catch(() => setError('Failed to load contest'))
      .finally(() => setLoading(false))
  }, [contestId])

  async function handleDelete() {
    if (!contest) return
    if (!window.confirm('이 랭킹전을 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      await deleteContest(contest.id)
      navigate(`/groups/${contest.group_id}`)
    } catch {
      setError('삭제에 실패했습니다.')
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
        >
          ← Back
        </button>
        {contest && me && me.id === contest.created_by_id && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ fontSize: '14px', padding: '6px 14px', cursor: deleting ? 'not-allowed' : 'pointer', color: '#c0392b', borderColor: '#c0392b' }}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : contest ? (
        <>
          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ margin: '0 0 8px' }}>{contest.name}</h2>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <div>
                <strong>랭킹 방식:</strong>{' '}
                {contest.ranking_type === 'match_point' ? '승점 (match_point)' : '점수 합산 (score)'}
              </div>
              <div>
                <strong>우마:</strong>{' '}
                {[contest.uma_1st, contest.uma_2nd, contest.uma_3rd, contest.uma_4th]
                  .map((v, i) => `${i + 1}위 ${v > 0 ? '+' : ''}${v}`)
                  .join(' / ')}
              </div>
              {contest.ranking_type === 'match_point' && (
                <div>
                  <strong>승점 배점:</strong>{' '}
                  {[contest.scoring_1st, contest.scoring_2nd, contest.scoring_3rd, contest.scoring_4th]
                    .map((v, i) => `${i + 1}위 ${v}pt`)
                    .join(' / ')}
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 style={{ margin: '0 0 12px' }}>랭킹</h3>
            {ranking.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>아직 게임 기록이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ccc', color: '#555', fontSize: '13px' }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>이름</th>
                    <th style={thStyle}>{contest.ranking_type === 'match_point' ? '승점' : '점수'}</th>
                    <th style={thStyle}>1위</th>
                    <th style={thStyle}>2위</th>
                    <th style={thStyle}>3위</th>
                    <th style={thStyle}>4위</th>
                    <th style={thStyle}>게임</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((entry, idx) => {
                    const mainScore = contest.ranking_type === 'match_point'
                      ? `${entry.matchPoint}pt`
                      : `${entry.totalScore > 0 ? '+' : ''}${entry.totalScore % 1 === 0 ? entry.totalScore : entry.totalScore.toFixed(1)}`
                    const isPositive = contest.ranking_type === 'match_point'
                      ? entry.matchPoint >= 0
                      : entry.totalScore >= 0
                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ ...tdStyle, color: '#888', fontWeight: 'bold' }}>{idx + 1}</td>
                        <td style={{ ...tdStyle, textAlign: 'left' }}>{entry.username}</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: isPositive ? '#2d7a3a' : '#c0392b' }}>{mainScore}</td>
                        <td style={tdStyle}>{entry.rankCounts[0]}</td>
                        <td style={tdStyle}>{entry.rankCounts[1]}</td>
                        <td style={tdStyle}>{entry.rankCounts[2]}</td>
                        <td style={tdStyle}>{entry.rankCounts[3]}</td>
                        <td style={{ ...tdStyle, color: '#aaa' }}>{entry.gameCount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
