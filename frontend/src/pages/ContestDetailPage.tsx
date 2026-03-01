import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useContest } from '../hooks/useContest'
import { useContestGameRecords } from '../hooks/useContestGameRecords'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useMe } from '../hooks/useMe'
import type { ContestResponse } from '../api/contests'
import type { GameRecordResponse } from '../api/gameRecords'

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

export default function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>()
  const navigate = useNavigate()
  const id = contestId ? Number(contestId) : undefined

  const { data: contest, isLoading, isError } = useContest(id)
  const { data: records = [] } = useContestGameRecords(id)
  const { data: group } = useGroupDetail(contest?.group_id ?? undefined)
  const { data: user } = useMe()

  const myRole = group && user ? group.members.find((m) => m.id === user.id)?.role ?? null : null
  const ranking = contest ? computeRanking(contest, records) : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        {contest && (myRole === 'owner' || myRole === 'admin') && (
          <button
            onClick={() => navigate(`/contests/${contestId}/manage`)}
            className="text-sm px-3.5 py-1.5 cursor-pointer"
          >
            관리
          </button>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="text-red-600">Failed to load contest</p>
      ) : contest ? (
        <>
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="mt-0 mb-0">{contest.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded ${
                contest.contest_type === 'overall'
                  ? 'bg-yellow-100 text-yellow-700'
                  : contest.contest_type === 'independent'
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-blue-50 text-blue-700'
              }`}>
                {contest.contest_type === 'overall' ? '전체 랭킹' : contest.contest_type === 'independent' ? '독립' : '일반'}
              </span>
            </div>
            <div className="text-[13px] text-gray-600 leading-loose border-t border-gray-100 pt-3">
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

          <section className="mb-8">
            <h3 className="mt-0 mb-3">랭킹</h3>
            {ranking.length === 0 ? (
              <p className="text-sm text-gray-400 m-0">아직 게임 기록이 없습니다.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 text-gray-600 text-[13px]">
                    <th className="px-2.5 py-2 text-center whitespace-nowrap">#</th>
                    <th className="px-2.5 py-2 text-left whitespace-nowrap">이름</th>
                    <th className="px-2.5 py-2 text-center whitespace-nowrap">{contest.ranking_type === 'match_point' ? '승점' : '점수'}</th>
                    <th className="px-2.5 py-2 text-center whitespace-nowrap">1위</th>
                    <th className="px-2.5 py-2 text-center whitespace-nowrap">2위</th>
                    <th className="px-2.5 py-2 text-center whitespace-nowrap">3위</th>
                    <th className="px-2.5 py-2 text-center whitespace-nowrap">4위</th>
                    <th className="px-2.5 py-2 text-center whitespace-nowrap">게임</th>
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
                      <tr key={entry.id} className="border-b border-gray-100">
                        <td className="px-2.5 py-2.5 text-center text-gray-400 font-bold whitespace-nowrap">{idx + 1}</td>
                        <td className="px-2.5 py-2.5 text-left whitespace-nowrap">{entry.username}</td>
                        <td className={`px-2.5 py-2.5 text-center font-bold whitespace-nowrap ${isPositive ? 'text-green-700' : 'text-red-600'}`}>{mainScore}</td>
                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[0]}</td>
                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[1]}</td>
                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[2]}</td>
                        <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[3]}</td>
                        <td className="px-2.5 py-2.5 text-center text-gray-400 whitespace-nowrap">{entry.gameCount}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3 className="mt-0 mb-3">게임 기록</h3>
            {records.length === 0 ? (
              <p className="text-sm text-gray-400 m-0">아직 게임 기록이 없습니다.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-2">
                {[...records].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()).map((rec) => (
                  <li key={rec.id} className="border border-gray-300 rounded-md px-4 py-3 text-sm">
                    <div className="mb-1.5">
                      <span className="text-xs text-gray-400">{new Date(rec.played_at).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: '동', player: rec.east_player, point: rec.east_point },
                        { label: '남', player: rec.south_player, point: rec.south_point },
                        { label: '서', player: rec.west_player, point: rec.west_point },
                        { label: '북', player: rec.north_player, point: rec.north_point },
                      ].map(({ label, player, point }) => (
                        <div key={label}>
                          <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                          <div className="font-medium">{player.username}</div>
                          <div className="text-xs text-gray-600">{point.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
