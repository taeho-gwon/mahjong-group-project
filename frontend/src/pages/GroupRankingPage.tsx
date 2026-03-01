import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listContests } from '../api/contests'

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    listContests(Number(id))
      .then((contests) => {
        const totalContest = contests.find((c) => c.name === '전체 랭킹')
        if (!totalContest) {
          setError('전체 랭킹을 찾을 수 없습니다.')
          return
        }
        navigate(`/contests/${totalContest.id}`, { replace: true })
      })
      .catch(() => setError('Failed to load contests'))
  }, [id, navigate])

  if (error) return <p style={{ padding: '24px', color: 'red' }}>{error}</p>
  return <p style={{ padding: '24px' }}>Loading...</p>
}
