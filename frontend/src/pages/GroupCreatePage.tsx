import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateGroup } from '../hooks/mutations/useCreateGroup'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function GroupCreatePage() {
  const navigate = useNavigate()
  const createGroupMutation = useCreateGroup()

  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [groupJoinPolicy, setGroupJoinPolicy] = useState<'public' | 'private'>('public')
  const [weeklyStartDay, setWeeklyStartDay] = useState(0)
  const [monthlyStartDay, setMonthlyStartDay] = useState(1)
  const [createError, setCreateError] = useState('')

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault()
    setCreateError('')
    try {
      const group = await createGroupMutation.mutateAsync({
        name: groupName,
        description: groupDesc || null,
        join_policy: groupJoinPolicy,
        weekly_start_day: weeklyStartDay,
        monthly_start_day: monthlyStartDay,
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
          className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
        />
        <input
          type="text"
          placeholder="설명 (선택)"
          value={groupDesc}
          onChange={(e) => setGroupDesc(e.target.value)}
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
