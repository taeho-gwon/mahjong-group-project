import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContests } from '../hooks/useContests'

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: contests, isError } = useContests(id ? Number(id) : undefined)

  useEffect(() => {
    if (!contests) return
    const totalContest = contests.find((c) => c.name === '전체 랭킹')
    if (!totalContest) return
    navigate(`/contests/${totalContest.id}`, { replace: true })
  }, [contests, navigate])

  if (isError) return <p className="p-6 text-red-600">Failed to load contests</p>
  if (contests && !contests.find((c) => c.name === '전체 랭킹')) {
    return <p className="p-6 text-red-600">전체 랭킹을 찾을 수 없습니다.</p>
  }
  return <p className="p-6">Loading...</p>
}
