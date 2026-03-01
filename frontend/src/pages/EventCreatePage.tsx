import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { RankingType, EventType } from '../api/events'
import { useCreateEvent } from '../hooks/mutations/useCreateEvent'

type PeriodPreset = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' | 'custom'

function computePeriod(preset: PeriodPreset): { start: string | null; end: string | null } {
  if (preset === 'all') return { start: null, end: null }
  if (preset === 'custom') return { start: '', end: '' }
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  if (preset === 'daily') {
    end.setDate(end.getDate() + 1)
  } else if (preset === 'weekly') {
    const day = start.getDay()
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
    end.setTime(start.getTime())
    end.setDate(end.getDate() + 7)
  } else if (preset === 'monthly') {
    start.setDate(1)
    end.setTime(start.getTime())
    end.setMonth(end.getMonth() + 1)
  } else if (preset === 'yearly') {
    start.setMonth(0); start.setDate(1)
    end.setTime(start.getTime())
    end.setFullYear(end.getFullYear() + 1)
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export default function EventCreatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const createEventMutation = useCreateEvent(groupId)

  const [name, setName] = useState('')
  const [eventType, setEventType] = useState<EventType>('regular')
  const [rankingType, setRankingType] = useState<RankingType>('score')
  const [uma, setUma] = useState({ uma_1st: 30, uma_2nd: 10, uma_3rd: -10, uma_4th: -30 })
  const [scoring, setScoring] = useState({ scoring_1st: 4, scoring_2nd: 2, scoring_3rd: 1, scoring_4th: 0 })
  const [error, setError] = useState('')

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all')
  const [periodStart, setPeriodStart] = useState<string | null>(null)
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)

  const umaSum = uma.uma_1st + uma.uma_2nd + uma.uma_3rd + uma.uma_4th

  function handlePresetChange(preset: PeriodPreset) {
    setPeriodPreset(preset)
    const { start, end } = computePeriod(preset)
    setPeriodStart(start)
    setPeriodEnd(end)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('이름을 입력하세요.')
      return
    }
    if (umaSum !== 0) {
      setError(`우마 합계가 0이어야 합니다. 현재 합계: ${umaSum}`)
      return
    }
    setError('')
    try {
      await createEventMutation.mutateAsync({
        name: name.trim(),
        event_type: eventType,
        group_id: groupId ?? null,
        ranking_type: rankingType,
        ...uma,
        ...scoring,
        ...(eventType === 'aggregate' ? {
          period_start: periodStart || null,
          period_end: periodEnd || null,
          preset_type: periodPreset,
        } : {}),
      })
      navigate(`/groups/${id}`)
    } catch {
      setError('이벤트 생성에 실패했습니다.')
    }
  }

  const EVENT_TYPE_DESC: Record<EventType, string> = {
    regular: '기록이 전체 랭킹에 합산됩니다.',
    independent: '기록이 전체 랭킹에 합산되지 않습니다. (연습전, 이벤트전 등)',
    aggregate: '다른 이벤트의 기록을 모아서 기간별로 집계합니다.',
  }

  const PRESET_LABELS: { value: PeriodPreset; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'daily', label: '일간' },
    { value: 'weekly', label: '주간' },
    { value: 'monthly', label: '월간' },
    { value: 'yearly', label: '연간' },
    { value: 'custom', label: '직접 설정' },
  ]

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">이벤트 만들기</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <p className="text-red-600 m-0">{error}</p>}

        <div>
          <label className="block font-bold mb-1.5 text-sm">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이벤트 이름"
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
          />
        </div>

        <div>
          <label className="block font-bold mb-1.5 text-sm">이벤트 타입</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
          >
            <option value="regular">일반 이벤트 (regular)</option>
            <option value="independent">독립 이벤트 (independent)</option>
            <option value="aggregate">집계 (aggregate)</option>
          </select>
          <p className="mt-1.5 mb-0 text-xs text-gray-500">
            {EVENT_TYPE_DESC[eventType]}
          </p>
        </div>

        {eventType === 'aggregate' && (
          <div>
            <label className="block font-bold mb-1.5 text-sm">집계 기간</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_LABELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePresetChange(value)}
                  className={`text-xs px-3 py-1.5 rounded border cursor-pointer ${
                    periodPreset === value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-transparent border-gray-300 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {periodPreset === 'custom' ? (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={periodStart ?? ''}
                  onChange={(e) => setPeriodStart(e.target.value || null)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="date"
                  value={periodEnd ?? ''}
                  onChange={(e) => setPeriodEnd(e.target.value || null)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
            ) : periodPreset !== 'all' && periodStart && periodEnd ? (
              <p className="mt-0 mb-0 text-xs text-gray-500">
                {periodStart} ~ {periodEnd}
              </p>
            ) : (
              <p className="mt-0 mb-0 text-xs text-gray-500">전체 기간 (제한 없음)</p>
            )}
          </div>
        )}

        <div>
          <label className="block font-bold mb-1.5 text-sm">랭킹 방식</label>
          <select
            value={rankingType}
            onChange={(e) => setRankingType(e.target.value as RankingType)}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
          >
            <option value="score">점수 합산 (score)</option>
            <option value="match_point">승점 (match_point)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold mb-1.5 text-sm">
            우마{' '}
            <span className={`font-normal text-[13px] ${umaSum === 0 ? 'text-green-700' : 'text-red-600'}`}>
              (합계: {umaSum > 0 ? '+' : ''}{umaSum})
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['uma_1st', 'uma_2nd', 'uma_3rd', 'uma_4th'] as const).map((key, idx) => (
              <div key={key}>
                <div className="text-xs text-gray-500 mb-1 text-center">{idx + 1}위</div>
                <input
                  type="number"
                  value={uma[key]}
                  onChange={(e) => setUma((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="border border-gray-300 rounded px-1.5 py-1.5 w-full text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {rankingType === 'match_point' && (
          <div>
            <label className="block font-bold mb-1.5 text-sm">승점 배점</label>
            <div className="grid grid-cols-4 gap-2">
              {(['scoring_1st', 'scoring_2nd', 'scoring_3rd', 'scoring_4th'] as const).map((key, idx) => (
                <div key={key}>
                  <div className="text-xs text-gray-500 mb-1 text-center">{idx + 1}위</div>
                  <input
                    type="number"
                    value={scoring[key]}
                    onChange={(e) => setScoring((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="border border-gray-300 rounded px-1.5 py-1.5 w-full text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createEventMutation.isPending}
            className="px-5 py-2 text-sm cursor-pointer"
          >
            {createEventMutation.isPending ? '생성 중...' : '생성'}
          </button>
        </div>
      </form>
    </div>
  )
}
