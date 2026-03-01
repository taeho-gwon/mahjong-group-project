import { Link, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useMe } from '../hooks/useMe'
import { useMyGroups } from '../hooks/useMyGroups'
import { useAuthStore } from '../stores/authStore'

export default function MyPage() {
  const navigate = useNavigate()
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const { data: user, isLoading: loadingUser } = useMe()
  const { data: groups = [], isLoading: loadingGroups } = useMyGroups()

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
