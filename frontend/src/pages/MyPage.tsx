import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useMe } from '../hooks/useMe'
import { useMyGroups } from '../hooks/useMyGroups'
import { useUpdateMe } from '../hooks/mutations/useUpdateMe'
import { useAuthStore } from '../stores/authStore'

export default function MyPage() {
  const navigate = useNavigate()
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const { data: user, isLoading: loadingUser } = useMe()
  const { data: groups = [], isLoading: loadingGroups } = useMyGroups()
  const updateMeMutation = useUpdateMe()

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')

  function handleStartEditNickname() {
    setNicknameInput(user?.nickname ?? '')
    setEditingNickname(true)
  }

  async function handleSaveNickname() {
    await updateMeMutation.mutateAsync({ nickname: nicknameInput.trim() || null })
    setEditingNickname(false)
  }

  function handleLogout() {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="flex justify-between items-center mb-6">
        <Link to="/" className="text-sm">← Back</Link>
        <button onClick={handleLogout} className="px-2.5 py-1 text-sm cursor-pointer">
          Logout
        </button>
      </header>

      {/* Profile */}
      <section className="mb-8">
        <h2 className="mt-0 mb-3">내 프로필</h2>
        {loadingUser ? (
          <Spinner />
        ) : user ? (
          <div className="leading-relaxed text-sm">
            <div><strong>이름:</strong> {user.username}</div>
            <div className="flex items-center gap-2">
              <strong>닉네임:</strong>
              {editingNickname ? (
                <span className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    maxLength={50}
                    placeholder="닉네임 입력"
                    className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
                  />
                  <button
                    onClick={handleSaveNickname}
                    disabled={updateMeMutation.isPending}
                    className="text-xs px-2 py-0.5 cursor-pointer"
                  >
                    {updateMeMutation.isPending ? '...' : '저장'}
                  </button>
                  <button
                    onClick={() => setEditingNickname(false)}
                    className="text-xs px-2 py-0.5 cursor-pointer bg-transparent border border-gray-300 rounded"
                  >
                    취소
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className={user.nickname ? '' : 'text-gray-400'}>{user.nickname ?? '미설정'}</span>
                  <button
                    onClick={handleStartEditNickname}
                    className="text-xs px-2 py-0.5 cursor-pointer bg-transparent border border-gray-300 rounded"
                  >
                    변경
                  </button>
                </span>
              )}
            </div>
            <div><strong>가입일:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        ) : null}
      </section>

      {/* My Groups */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="mt-0 mb-0">내 모임</h2>
          <Link to="/groups/new" className="px-3 py-1.5 text-sm no-underline border border-gray-300 rounded-md">
            + 모임 만들기
          </Link>
        </div>
        {loadingGroups ? (
          <Spinner />
        ) : groups.length === 0 ? (
          <p className="text-gray-400">아직 가입한 모임이 없습니다.</p>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/groups/${g.id}`}
                  className="block border border-gray-300 rounded-md p-3 no-underline text-inherit"
                >
                  <div className="font-bold">{g.name}</div>
                  {g.description && <div className="text-gray-600 mt-1 text-sm">{g.description}</div>}
                  <div className="text-xs text-gray-400 mt-1">
                    Created {new Date(g.created_at).toLocaleDateString()}
                    {g.owner_id === user?.id && ' · Owner'}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
