import { useState } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useGroupRanking } from '../hooks/useGroupRanking'
import { ApiError } from '../api/errors'

type PeriodTab = 'daily' | 'weekly' | 'monthly' | 'all'

const PERIOD_LABELS: { value: PeriodTab; label: string }[] = [
  { value: 'daily', label: '일간' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
  { value: 'all', label: '전체' },
]

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const { isLoading: groupLoading, isError: groupError, error } = useGroupDetail(groupId)
  const [activeTab, setActiveTab] = useState<PeriodTab>('all')
  const [offset, setOffset] = useState(0)

  const { data: ranking, isLoading: rankingLoading, isError: rankingError } = useGroupRanking(
    groupId,
    activeTab,
    activeTab !== 'all' ? offset : undefined,
  )

  const isMatchPoint = ranking?.ranking_type === 'match_point'
  const isLoading = groupLoading || rankingLoading
  const isError = groupError || rankingError
  const items = ranking?.items ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/groups/${id}`)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">그룹 랭킹</h2>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        error instanceof ApiError && error.isForbidden ? (
          <Navigate to="/forbidden" replace />
        ) : error instanceof ApiError && error.isNotFound ? (
          <Navigate to="/not-found" replace />
        ) : (
          <p className="mt-6 text-red-600 dark:text-red-400">모임 정보를 불러올 수 없습니다.</p>
        )
      ) : (
        <>
          <div className="flex gap-1.5 mb-4">
            {PERIOD_LABELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setActiveTab(value); setOffset(0) }}
                className={`text-sm px-3.5 py-1.5 rounded border cursor-pointer ${
                  activeTab === value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab !== 'all' && (
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setOffset((o) => o - 1)}
                className="text-sm px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer dark:text-gray-300"
              >
                ← 이전
              </button>
              {offset !== 0 && (
                <button
                  type="button"
                  onClick={() => setOffset(0)}
                  className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer text-blue-600 dark:text-blue-400"
                >
                  {activeTab === 'daily' ? '오늘' : activeTab === 'weekly' ? '이번 주' : '이번 달'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOffset((o) => o + 1)}
                disabled={offset >= 0}
                className="text-sm px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-default dark:text-gray-300"
              >
                다음 →
              </button>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 m-0">해당 기간에 게임 기록이 없습니다.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-[13px]">
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">#</th>
                  <th className="px-2.5 py-2 text-left whitespace-nowrap">이름</th>
                  {isMatchPoint && <th className="px-2.5 py-2 text-center whitespace-nowrap">승점</th>}
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">점수</th>
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">1위</th>
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">2위</th>
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">3위</th>
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">4위</th>
                  <th className="px-2.5 py-2 text-center whitespace-nowrap">게임</th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => {
                  const score = entry.ranking_score
                  const scoreStr = `${score > 0 ? '+' : ''}${score % 1 === 0 ? score : score.toFixed(1)}`
                  const isPositive = score >= 0
                  return (
                    <tr key={entry.user_id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-2.5 py-2.5 text-center text-gray-400 dark:text-gray-500 font-bold whitespace-nowrap">{entry.rank}</td>
                      <td className="px-2.5 py-2.5 text-left whitespace-nowrap">
                        <Link to={`/groups/${id}/members/${entry.user_id}/stats`} className="no-underline text-inherit">{entry.display_name}</Link>
                      </td>
                      {isMatchPoint && (
                        <td className="px-2.5 py-2.5 text-center font-bold whitespace-nowrap text-blue-700 dark:text-blue-400">
                          {entry.match_point}
                        </td>
                      )}
                      <td className={`px-2.5 py-2.5 text-center whitespace-nowrap ${isMatchPoint ? 'text-gray-500 dark:text-gray-400' : `font-bold ${isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}`}>
                        {scoreStr}
                      </td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.placement_counts.first}</td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.placement_counts.second}</td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.placement_counts.third}</td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.placement_counts.fourth}</td>
                      <td className="px-2.5 py-2.5 text-center text-gray-400 dark:text-gray-500 whitespace-nowrap">{entry.total_games}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
