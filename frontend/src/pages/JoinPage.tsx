import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { joinByInvite } from '../api/groups'
import { ApiError } from '../api/errors'

export default function JoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <p className="text-red-600">유효하지 않은 초대 링크입니다.</p>
        <Link to="/">메인으로</Link>
      </div>
    )
  }

  async function handleJoin() {
    setJoining(true)
    setError(null)
    try {
      const group = await joinByInvite(token!, nickname.trim() || null)
      navigate(`/groups/${group.id}`, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setError(err.message)
      } else {
        setError('모임 가입에 실패했습니다')
      }
      setJoining(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h2 className="mt-0 mb-4">모임 참가</h2>
      <div className="mb-4">
        <label className="block text-sm font-bold mb-1.5">닉네임 (선택)</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={50}
          placeholder="모임 내 닉네임 (비우면 기본 닉네임 사용)"
          className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
        />
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <button
        onClick={handleJoin}
        disabled={joining}
        className="px-5 py-2 text-sm cursor-pointer disabled:opacity-50"
      >
        {joining ? '가입 중...' : '가입'}
      </button>
      <div className="mt-4">
        <Link to="/" className="text-sm text-gray-500">메인으로</Link>
      </div>
    </div>
  )
}
