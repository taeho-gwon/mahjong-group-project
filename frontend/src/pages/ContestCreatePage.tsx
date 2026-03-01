import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { RankingType } from '../api/contests'
import { useCreateContest } from '../hooks/mutations/useCreateContest'

export default function ContestCreatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const createContestMutation = useCreateContest(groupId)

  const [name, setName] = useState('')
  const [rankingType, setRankingType] = useState<RankingType>('score')
  const [uma, setUma] = useState({ uma_1st: 30, uma_2nd: 10, uma_3rd: -10, uma_4th: -30 })
  const [scoring, setScoring] = useState({ scoring_1st: 4, scoring_2nd: 2, scoring_3rd: 1, scoring_4th: 0 })
  const [error, setError] = useState('')

  const umaSum = uma.uma_1st + uma.uma_2nd + uma.uma_3rd + uma.uma_4th

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
      await createContestMutation.mutateAsync({
        name: name.trim(),
        group_id: groupId ?? null,
        ranking_type: rankingType,
        ...uma,
        ...scoring,
      })
      navigate(`/groups/${id}`)
    } catch {
      setError('랭킹전 생성에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">랭킹전 만들기</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <p className="text-red-600 m-0">{error}</p>}

        <div>
          <label className="block font-bold mb-1.5 text-sm">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="랭킹전 이름"
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
          />
        </div>

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
            disabled={createContestMutation.isPending}
            className="px-5 py-2 text-sm cursor-pointer"
          >
            {createContestMutation.isPending ? '생성 중...' : '생성'}
          </button>
        </div>
      </form>
    </div>
  )
}
