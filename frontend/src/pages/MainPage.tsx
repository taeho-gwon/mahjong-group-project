import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPublicGroups } from '../api/groups'
import type { GroupResponse } from '../api/groups'

const PAGE_SIZE = 10

export default function MainPage() {
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    setLoading(true)
    setError('')
    getPublicGroups(page, PAGE_SIZE)
      .then((data) => {
        setGroups(data.items)
        setTotal(data.total)
      })
      .catch(() => setError('Failed to load groups'))
      .finally(() => setLoading(false))
  }, [page])

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Nav */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Mahjong Groups</h1>
        <nav style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/mypage" style={{ fontSize: '14px' }}>My Page</Link>
          <button onClick={handleLogout} style={{ padding: '4px 10px', fontSize: '14px', cursor: 'pointer' }}>
            Logout
          </button>
        </nav>
      </header>

      {/* Group List */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : groups.length === 0 ? (
        <p style={{ color: '#888' }}>No public groups yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                to={`/groups/${g.id}`}
                style={{ display: 'block', border: '1px solid #ccc', borderRadius: '6px', padding: '14px', textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{g.name}</div>
                {g.description && (
                  <div style={{ color: '#555', marginTop: '4px', fontSize: '14px' }}>{g.description}</div>
                )}
                <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  {new Date(g.created_at).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            Prev
          </button>
          <span style={{ fontSize: '14px' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
