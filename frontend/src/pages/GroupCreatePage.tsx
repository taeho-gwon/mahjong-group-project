import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateGroup } from '../hooks/mutations/useCreateGroup'
import type { RankingType } from '../api/groups'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function GroupCreatePage() {
  const navigate = useNavigate()
  const createGroupMutation = useCreateGroup()

  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [groupJoinPolicy, setGroupJoinPolicy] = useState<'public' | 'private'>('public')
  const [weeklyStartDay, setWeeklyStartDay] = useState(0)
  const [monthlyStartDay, setMonthlyStartDay] = useState(1)
  const [rankingType, setRankingType] = useState<RankingType>('score')
  const [uma, setUma] = useState({ default_uma_1st: '30', default_uma_2nd: '10', default_uma_3rd: '-10', default_uma_4th: '-30' })
  const [scoring, setScoring] = useState({ default_scoring_1st: '4', default_scoring_2nd: '2', default_scoring_3rd: '1', default_scoring_4th: '0' })
  const [createError, setCreateError] = useState('')

  const toNum = (s: string) => Number(s) || 0
  const umaSum = toNum(uma.default_uma_1st) + toNum(uma.default_uma_2nd) + toNum(uma.default_uma_3rd) + toNum(uma.default_uma_4th)

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault()
    setCreateError('')
    if (Object.values(uma).some(v => !Number.isInteger(Number(v)))) {
      setCreateError('우마 값은 정수로 입력하세요.')
      return
    }
    if (rankingType === 'match_point' && Object.values(scoring).some(v => !Number.isInteger(Number(v)) || Number(v) < 0)) {
      setCreateError('승점 값은 0 이상의 정수로 입력하세요.')
      return
    }
    if (umaSum !== 0) {
      setCreateError(`우마 합계가 0이어야 합니다. 현재 합계: ${umaSum}`)
      return
    }
    try {
      const group = await createGroupMutation.mutateAsync({
        name: groupName,
        description: groupDesc || null,
        join_policy: groupJoinPolicy,
        weekly_start_day: weeklyStartDay,
        monthly_start_day: monthlyStartDay,
        default_ranking_type: rankingType,
        default_uma_1st: toNum(uma.default_uma_1st),
        default_uma_2nd: toNum(uma.default_uma_2nd),
        default_uma_3rd: toNum(uma.default_uma_3rd),
        default_uma_4th: toNum(uma.default_uma_4th),
        default_scoring_1st: toNum(scoring.default_scoring_1st),
        default_scoring_2nd: toNum(scoring.default_scoring_2nd),
        default_scoring_3rd: toNum(scoring.default_scoring_3rd),
        default_scoring_4th: toNum(scoring.default_scoring_4th),
      })
      navigate(`/groups/${group.id}`)
    } catch {
      setCreateError('모임 생성에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6">
        <Link to="/mypage" className="text-sm">← Back</Link>
      </header>

      <h1 className="mt-0 mb-4">모임 만들기</h1>

      <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="모임 이름 *"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
          maxLength={100}
          className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
        />
        <input
          type="text"
          placeholder="설명 (선택)"
          value={groupDesc}
          onChange={(e) => setGroupDesc(e.target.value)}
          maxLength={500}
          className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
        />
        <div className="flex gap-4 text-sm items-center">
          <span className="text-gray-600">가입 정책:</span>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="joinPolicy"
              value="public"
              checked={groupJoinPolicy === 'public'}
              onChange={() => setGroupJoinPolicy('public')}
              className="mr-1"
            />
            공개
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="joinPolicy"
              value="private"
              checked={groupJoinPolicy === 'private'}
              onChange={() => setGroupJoinPolicy('private')}
              className="mr-1"
            />
            비공개
          </label>
        </div>

        <div>
          <label className="block text-[13px] text-gray-600 mb-1">주간 랭킹 시작 요일</label>
          <select
            value={weeklyStartDay}
            onChange={(e) => setWeeklyStartDay(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
          >
            {WEEKDAYS.map((day, idx) => (
              <option key={idx} value={idx}>{day}요일</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] text-gray-600 mb-1">월간 랭킹 시작일</label>
          <select
            value={monthlyStartDay}
            onChange={(e) => setMonthlyStartDay(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] text-gray-600 mb-1">기본 랭킹 방식</label>
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
          <label className="block text-[13px] text-gray-600 mb-1">
            기본 우마{' '}
            <span className={`font-normal ${umaSum === 0 ? 'text-green-700' : 'text-red-600'}`}>
              (합계: {umaSum > 0 ? '+' : ''}{umaSum})
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['default_uma_1st', 'default_uma_2nd', 'default_uma_3rd', 'default_uma_4th'] as const).map((key, idx) => (
              <div key={key}>
                <div className="text-xs text-gray-500 mb-1 text-center">{idx + 1}위</div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={uma[key]}
                  onChange={(e) => setUma((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="border border-gray-300 rounded px-1.5 py-1.5 w-full text-center"
                />
              </div>
            ))}
          </div>
        </div>

        {rankingType === 'match_point' && (
          <div>
            <label className="block text-[13px] text-gray-600 mb-1">기본 승점 배점</label>
            <div className="grid grid-cols-4 gap-2">
              {(['default_scoring_1st', 'default_scoring_2nd', 'default_scoring_3rd', 'default_scoring_4th'] as const).map((key, idx) => (
                <div key={key}>
                  <div className="text-xs text-gray-500 mb-1 text-center">{idx + 1}위</div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={scoring[key]}
                    onChange={(e) => setScoring((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="border border-gray-300 rounded px-1.5 py-1.5 w-full text-center"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {createError && <p className="text-red-600 m-0">{createError}</p>}
        <button
          type="submit"
          disabled={createGroupMutation.isPending}
          className="px-4 py-2 cursor-pointer self-start"
        >
          {createGroupMutation.isPending ? '생성 중...' : '생성'}
        </button>
      </form>
    </div>
  )
}
