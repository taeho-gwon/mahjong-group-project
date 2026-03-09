import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useEvents } from '../hooks/useEvents'
import { useGroupGameRecords } from '../hooks/useGroupGameRecords'
import { getDisplayName } from '../api/groups'
import { ApiError } from '../api/errors'
import type { EventResponse } from '../api/events'
import type { GameRecordResponse } from '../api/gameRecords'

type PeriodTab = 'daily' | 'weekly' | 'monthly' | 'all'

const PERIOD_LABELS: { value: PeriodTab; label: string }[] = [
  { value: 'daily', label: '일간' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
  { value: 'all', label: '전체' },
]

import type { GroupDetailResponse } from '../api/groups'

interface RankingEntry {
  id: number
  username: string
  totalScore: number
  matchPoint: number
  rankCounts: [number, number, number, number]
  gameCount: number
}

function getPeriodRange(
  tab: PeriodTab,
  weeklyStartDay: number,
  monthlyStartDay: number,
  offset: number,
): { start: Date; end: Date } | null {
  if (tab === 'all') return null

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (tab === 'daily') {
    const start = new Date(now)
    start.setDate(start.getDate() + offset)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end }
  }

  if (tab === 'weekly') {
    const jsDay = now.getDay()
    const jsStartDay = (weeklyStartDay + 1) % 7
    let diff = jsDay - jsStartDay
    if (diff < 0) diff += 7
    const start = new Date(now)
    start.setDate(start.getDate() - diff + offset * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }

  if (tab === 'monthly') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const day = now.getDate()

    let baseMonth: number
    if (day >= monthlyStartDay) {
      baseMonth = month
    } else {
      baseMonth = month - 1
    }
    const start = new Date(year, baseMonth + offset, monthlyStartDay)
    const end = new Date(year, baseMonth + offset + 1, monthlyStartDay)
    return { start, end }
  }

  return null
}

function formatPeriod(range: { start: Date; end: Date } | null): string {
  if (!range) return '전체 기간'
  const fmt = (d: Date) => d.toLocaleDateString()
  const endDisplay = new Date(range.end)
  endDisplay.setDate(endDisplay.getDate() - 1)
  return `${fmt(range.start)} ~ ${fmt(endDisplay)}`
}

function computeGroupRanking(
  records: GameRecordResponse[],
  eventsById: Map<number, EventResponse>,
  nameMap: Map<number, string>,
  group: GroupDetailResponse,
): RankingEntry[] {
  const playerMap = new Map<number, RankingEntry>()
  const defaultUma = [group.default_uma_1st, group.default_uma_2nd, group.default_uma_3rd, group.default_uma_4th]
  const defaultScoring = [group.default_scoring_1st, group.default_scoring_2nd, group.default_scoring_3rd, group.default_scoring_4th]

  for (const rec of records) {
    const event = rec.event_id ? eventsById.get(rec.event_id) : null
    const uma = event
      ? [event.uma_1st, event.uma_2nd, event.uma_3rd, event.uma_4th]
      : defaultUma
    const scoring = event
      ? [event.scoring_1st, event.scoring_2nd, event.scoring_3rd, event.scoring_4th]
      : defaultScoring

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
        username: nameMap.get(player.id) ?? player.username,
        totalScore: 0,
        matchPoint: 0,
        rankCounts: [0, 0, 0, 0] as [number, number, number, number],
        gameCount: 0,
      }
      entry.totalScore += (point - 25000) / 1000 + uma[rank]
      entry.matchPoint += scoring[rank]
      entry.rankCounts[rank] += 1
      entry.gameCount += 1
      playerMap.set(player.id, entry)
    })
  }

  const entries = [...playerMap.values()]
  if (group.default_ranking_type === 'match_point') {
    entries.sort((a, b) => b.matchPoint - a.matchPoint || b.totalScore - a.totalScore)
  } else {
    entries.sort((a, b) => b.totalScore - a.totalScore)
  }
  return entries
}

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const { data: group, isLoading: groupLoading, isError, error } = useGroupDetail(groupId)
  const { data: events = [] } = useEvents(groupId)
  const { data: allRecords = [], isLoading: recordsLoading } = useGroupGameRecords(groupId)

  const [activeTab, setActiveTab] = useState<PeriodTab>('all')
  const [offset, setOffset] = useState(0)

  const regularEventIds = useMemo(() => {
    const ids = new Set<number>()
    for (const e of events) {
      if (e.event_type === 'regular') ids.add(e.id)
    }
    return ids
  }, [events])

  const eventsById = useMemo(() => {
    const map = new Map<number, EventResponse>()
    for (const e of events) map.set(e.id, e)
    return map
  }, [events])

  const periodRange = useMemo(
    () => getPeriodRange(activeTab, group?.weekly_start_day ?? 0, group?.monthly_start_day ?? 1, offset),
    [activeTab, group?.weekly_start_day, group?.monthly_start_day, offset],
  )

  const filteredRecords = useMemo(() => {
    // Include records from regular events or records without event (event_id = null)
    const byEvent = allRecords.filter(
      (r) => r.event_id === null || regularEventIds.has(r.event_id),
    )
    if (!periodRange) return byEvent
    return byEvent.filter((r) => {
      const playedAt = new Date(r.played_at)
      return playedAt >= periodRange.start && playedAt < periodRange.end
    })
  }, [allRecords, regularEventIds, periodRange])

  const nameMap = useMemo(() => {
    const map = new Map<number, string>()
    if (group) {
      for (const m of group.members) map.set(m.id, getDisplayName(m))
    }
    return map
  }, [group])

  const ranking = useMemo(
    () => group ? computeGroupRanking(filteredRecords, eventsById, nameMap, group) : [],
    [filteredRecords, eventsById, nameMap, group],
  )

  const isMatchPoint = group?.default_ranking_type === 'match_point'
  const isLoading = groupLoading || recordsLoading

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

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 m-0">
            {formatPeriod(periodRange)}
          </p>

          {ranking.length === 0 ? (
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
                {ranking.map((entry, idx) => {
                  const scoreStr = `${entry.totalScore > 0 ? '+' : ''}${entry.totalScore % 1 === 0 ? entry.totalScore : entry.totalScore.toFixed(1)}`
                  const isPositive = entry.totalScore >= 0
                  return (
                    <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-2.5 py-2.5 text-center text-gray-400 dark:text-gray-500 font-bold whitespace-nowrap">{idx + 1}</td>
                      <td className="px-2.5 py-2.5 text-left whitespace-nowrap">
                        <Link to={`/users/${entry.id}`} className="no-underline text-inherit">{entry.username}</Link>
                      </td>
                      {isMatchPoint && (
                        <td className="px-2.5 py-2.5 text-center font-bold whitespace-nowrap text-blue-700 dark:text-blue-400">
                          {entry.matchPoint}
                        </td>
                      )}
                      <td className={`px-2.5 py-2.5 text-center whitespace-nowrap ${isMatchPoint ? 'text-gray-500 dark:text-gray-400' : `font-bold ${isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}`}>
                        {scoreStr}
                      </td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[0]}</td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[1]}</td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[2]}</td>
                      <td className="px-2.5 py-2.5 text-center whitespace-nowrap">{entry.rankCounts[3]}</td>
                      <td className="px-2.5 py-2.5 text-center text-gray-400 dark:text-gray-500 whitespace-nowrap">{entry.gameCount}</td>
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
