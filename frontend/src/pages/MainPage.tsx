import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePublicGroups } from '../hooks/usePublicGroups'
import { useAuthStore } from '../stores/authStore'

const PAGE_SIZE = 10

export default function MainPage() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const clearTokens = useAuthStore((s) => s.clearTokens)
  const { data, isLoading, isError } = usePublicGroups(page)

  const groups = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function handleLogout() {
    clearTokens()
    navigate('/login')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="m-0 text-xl font-bold">Mahjong Groups</h1>
        <nav className="flex gap-3 items-center">
          <Link to="/mypage" className="text-sm">My Page</Link>
          <button onClick={handleLogout} className="px-2.5 py-1 text-sm cursor-pointer">
            Logout
          </button>
        </nav>
      </header>

      {isLoading ? (
        <p>Loading...</p>
      ) : isError ? (
        <p className="text-red-600">Failed to load groups</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-400">No public groups yet.</p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                to={`/groups/${g.id}`}
                className="block border border-gray-300 rounded-md p-[14px] no-underline text-inherit"
              >
                <div className="font-bold text-[15px]">{g.name}</div>
                {g.description && (
                  <div className="text-gray-600 mt-1 text-sm">{g.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-1.5">
                  {new Date(g.created_at).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && total > 0 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 cursor-pointer"
          >
            Prev
          </button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
