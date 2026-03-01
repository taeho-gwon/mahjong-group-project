import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import type { RankingType } from '../api/contests'
import { useContest } from '../hooks/useContest'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useMe } from '../hooks/useMe'
import { useUpdateContest } from '../hooks/mutations/useUpdateContest'
import { useDeleteContest } from '../hooks/mutations/useDeleteContest'

export default function ContestManagePage() {
  const { contestId } = useParams<{ contestId: string }>()
  const navigate = useNavigate()
  const id = contestId ? Number(contestId) : undefined

  const { data: contest, isLoading, isError } = useContest(id)
  const { data: group } = useGroupDetail(contest?.group_id ?? undefined)
  const { data: me } = useMe()

  const updateContestMutation = useUpdateContest(id!)
  const deleteContestMutation = useDeleteContest(contest?.group_id)

  const [name, setName] = useState('')
  const [rankingType, setRankingType] = useState<RankingType>('score')
  const [uma, setUma] = useState({ uma_1st: 30, uma_2nd: 10, uma_3rd: -10, uma_4th: -30 })
  const [scoring, setScoring] = useState({ scoring_1st: 4, scoring_2nd: 2, scoring_3rd: 1, scoring_4th: 0 })
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const myRole = group && me ? group.members.find((m) => m.id === me.id)?.role ?? null : null

  const umaSum = uma.uma_1st + uma.uma_2nd + uma.uma_3rd + uma.uma_4th

  useEffect(() => {
    if (!contest || !group || !me) return
    const role = group.members.find((m) => m.id === me.id)?.role ?? null
    if (role !== 'owner' && role !== 'admin') {
      navigate(`/contests/${contestId}`, { replace: true })
      return
    }
    setName(contest.name)
    setRankingType(contest.ranking_type)
    setUma({ uma_1st: contest.uma_1st, uma_2nd: contest.uma_2nd, uma_3rd: contest.uma_3rd, uma_4th: contest.uma_4th })
    setScoring({ scoring_1st: contest.scoring_1st, scoring_2nd: contest.scoring_2nd, scoring_3rd: contest.scoring_3rd, scoring_4th: contest.scoring_4th })
  }, [contest, group, me, contestId, navigate])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (umaSum !== 0) {
      setSaveError(`우마 합계가 0이어야 합니다. 현재: ${umaSum}`)
      return
    }
    setSaveError('')
    setSaveSuccess(false)
    try {
      await updateContestMutation.mutateAsync({ name, ranking_type: rankingType, ...uma, ...scoring })
      setSaveSuccess(true)
    } catch {
      setSaveError('저장에 실패했습니다.')
    }
  }

  async function handleDelete() {
    if (!window.confirm('이 랭킹전을 삭제하시겠습니까?')) return
    try {
      await deleteContestMutation.mutateAsync(id!)
      navigate(contest?.group_id != null ? `/groups/${contest.group_id}` : '/', { replace: true })
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/contests/${contestId}`)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">랭킹전 관리</h2>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="text-red-600">Failed to load contest</p>
      ) : myRole ? (
        <>
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="block font-bold mb-1.5 text-sm">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaveSuccess(false) }}
                required
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-sm">랭킹 방식</label>
              <select
                value={rankingType}
                onChange={(e) => { setRankingType(e.target.value as RankingType); setSaveSuccess(false) }}
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
                      onChange={(e) => { setUma((prev) => ({ ...prev, [key]: Number(e.target.value) })); setSaveSuccess(false) }}
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
                        onChange={(e) => { setScoring((prev) => ({ ...prev, [key]: Number(e.target.value) })); setSaveSuccess(false) }}
                        className="border border-gray-300 rounded px-1.5 py-1.5 w-full text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {saveError && <p className="text-red-600 m-0 text-sm">{saveError}</p>}
            {saveSuccess && <p className="text-green-700 m-0 text-sm">저장되었습니다.</p>}

            <button
              type="submit"
              disabled={updateContestMutation.isPending}
              className="px-5 py-2 text-sm cursor-pointer self-start"
            >
              {updateContestMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </form>

          <hr className="my-10 border-gray-100" />

          <div>
            <h3 className="mt-0 mb-3 text-base text-red-600">위험 구역</h3>
            <button
              onClick={handleDelete}
              disabled={deleteContestMutation.isPending}
              className="px-5 py-2 text-sm cursor-pointer text-red-600 border-red-600"
            >
              {deleteContestMutation.isPending ? '삭제 중...' : '랭킹전 삭제'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
