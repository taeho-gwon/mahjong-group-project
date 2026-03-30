import { useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useMemberStats } from '../hooks/useMemberStats'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useEvents } from '../hooks/useEvents'
import { getDisplayName } from '../api/groups'
import { ApiError } from '../api/errors'

type PeriodTab = 'daily' | 'weekly' | 'monthly' | 'all'

const PERIOD_LABELS: { value: PeriodTab; label: string }[] = [
  { value: 'daily', label: '일간' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
  { value: 'all', label: '전체' },
]

export default function MemberStatsPage() {
  const { groupId: groupIdParam, userId: userIdParam } = useParams<{
    groupId: string
    userId: string
  }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const groupId = groupIdParam ? Number(groupIdParam) : undefined
  const userId = userIdParam ? Number(userIdParam) : undefined
  const eventIdParam = searchParams.get('eventId')
  const selectedEventId = eventIdParam ? Number(eventIdParam) : undefined

  const [activeTab, setActiveTab] = useState<PeriodTab>('all')
  const [periodOffset, setPeriodOffset] = useState(0)

  const periodParam = !selectedEventId && activeTab !== 'all' ? activeTab : undefined
  const offsetParam = !selectedEventId && activeTab !== 'all' ? periodOffset : undefined

  const { data: group, isLoading: groupLoading, isError, error } = useGroupDetail(groupId)
  const { data: events = [], isLoading: eventsLoading } = useEvents(groupId)
  const { data: stats, isLoading: statsLoading } = useMemberStats(groupId, userId, selectedEventId, periodParam, offsetParam)

  const memberName = useMemo(() => {
    if (!group || !userId) return ''
    const member = group.members.find((m) => m.id === userId)
    return member ? getDisplayName(member) : ''
  }, [group, userId])

  const isLoading = groupLoading || eventsLoading || statsLoading

  const handleEventChange = (value: string) => {
    if (value === '') {
      setSearchParams({})
    } else {
      setSearchParams({ eventId: value })
      setActiveTab('all')
    }
    setPeriodOffset(0)
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
        <h2 className="m-0 ml-4">개인 성적</h2>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        error instanceof ApiError && error.isForbidden ? (
          <Navigate to="/forbidden" replace />
        ) : error instanceof ApiError && error.isNotFound ? (
          <Navigate to="/not-found" replace />
        ) : (
          <p className="mt-6 text-red-600 dark:text-red-400">정보를 불러올 수 없습니다.</p>
        )
      ) : stats ? (
        <>
          {/* Player name */}
          <p className="text-lg font-semibold m-0 mb-4">{memberName}</p>

          {/* Event selector */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">이벤트</label>
            <select
              value={selectedEventId !== undefined ? String(selectedEventId) : ''}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">전체</option>
              {events.map((ev) => (
                <option key={ev.id} value={String(ev.id)}>
                  {ev.name}
                  {ev.is_closed ? ' (마감)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Period tabs (hidden when event is selected) */}
          {!selectedEventId && (
            <>
              <div className="flex gap-1.5 mb-4">
                {PERIOD_LABELS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setActiveTab(value); setPeriodOffset(0) }}
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

              {/* Offset navigation */}
              {activeTab !== 'all' && (
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setPeriodOffset((o) => o - 1)}
                    className="text-sm px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer dark:text-gray-300"
                  >
                    ← 이전
                  </button>
                  {periodOffset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPeriodOffset(0)}
                      className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer text-blue-600 dark:text-blue-400"
                    >
                      {activeTab === 'daily' ? '오늘' : activeTab === 'weekly' ? '이번 주' : '이번 달'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPeriodOffset((o) => o + 1)}
                    disabled={periodOffset >= 0}
                    className="text-sm px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-default dark:text-gray-300"
                  >
                    다음 →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard label="총 게임 수" value={`${stats.total_games}게임`} />
            <StatCard
              label="현재 순위"
              value={stats.rank !== null ? `${stats.rank}위` : '-'}
            />
            <StatCard
              label="랭킹 점수"
              value={formatScore(stats.ranking_score)}
              valueColor={stats.ranking_score >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
            />
            <StatCard
              label="게임 수"
              value={stats.total_games > 0 ? `${stats.total_games}` : '-'}
              hidden
            />
          </div>

          {/* Placement distribution */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="mt-0 mb-3 text-sm font-semibold">순위별 비율</h3>
            {stats.total_games === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 m-0">게임 기록이 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                <PlacementBar
                  label="1위"
                  count={stats.placement_counts.first}
                  total={stats.total_games}
                  color="bg-yellow-400 dark:bg-yellow-500"
                />
                <PlacementBar
                  label="2위"
                  count={stats.placement_counts.second}
                  total={stats.total_games}
                  color="bg-blue-400 dark:bg-blue-500"
                />
                <PlacementBar
                  label="3위"
                  count={stats.placement_counts.third}
                  total={stats.total_games}
                  color="bg-green-400 dark:bg-green-500"
                />
                <PlacementBar
                  label="4위"
                  count={stats.placement_counts.fourth}
                  total={stats.total_games}
                  color="bg-red-400 dark:bg-red-500"
                />
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  valueColor,
  hidden,
}: {
  label: string
  value: string
  valueColor?: string
  hidden?: boolean
}) {
  if (hidden) return null
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${valueColor ?? ''}`}>{value}</div>
    </div>
  )
}

function PlacementBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-6 text-right text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm w-20 text-right text-gray-600 dark:text-gray-400">
        {count}회 ({pct.toFixed(0)}%)
      </span>
    </div>
  )
}

function formatScore(score: number): string {
  const prefix = score > 0 ? '+' : ''
  const formatted = score % 1 === 0 ? String(score) : score.toFixed(1)
  return `${prefix}${formatted}`
}
