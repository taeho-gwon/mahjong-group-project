import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe } from '../api/auth'
import type { UserResponse } from '../api/auth'
import { getMyGroups, createGroup } from '../api/groups'
import type { GroupResponse } from '../api/groups'

export default function MyPage() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)

  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [groupJoinPolicy, setGroupJoinPolicy] = useState<'public' | 'private'>('public')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('access_token')
        navigate('/login')
      })
      .finally(() => setLoadingUser(false))

    getMyGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoadingGroups(false))
  }, [navigate])

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const group = await createGroup(groupName, groupDesc, groupJoinPolicy)
      setGroups((prev) => [group, ...prev])
      setGroupName('')
      setGroupDesc('')
      setGroupJoinPolicy('public')
    } catch {
      setCreateError('Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Nav */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Link to="/" style={{ fontSize: '14px' }}>← Back</Link>
        <button onClick={handleLogout} style={{ padding: '4px 10px', fontSize: '14px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* Profile */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 12px' }}>My Profile</h2>
        {loadingUser ? (
          <p>Loading...</p>
        ) : user ? (
          <div style={{ lineHeight: '1.8', fontSize: '14px' }}>
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        ) : null}
      </section>

      {/* Create Group */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 12px' }}>Create Group</h2>
        <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            placeholder="Group name *"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', alignItems: 'center' }}>
            <span style={{ color: '#555' }}>Join Policy:</span>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="joinPolicy"
                value="public"
                checked={groupJoinPolicy === 'public'}
                onChange={() => setGroupJoinPolicy('public')}
                style={{ marginRight: '4px' }}
              />
              Public
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="joinPolicy"
                value="private"
                checked={groupJoinPolicy === 'private'}
                onChange={() => setGroupJoinPolicy('private')}
                style={{ marginRight: '4px' }}
              />
              Private
            </label>
          </div>
          {createError && <p style={{ color: 'red', margin: 0 }}>{createError}</p>}
          <button type="submit" disabled={creating} style={{ padding: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>

      {/* My Groups */}
      <section>
        <h2 style={{ margin: '0 0 12px' }}>My Groups</h2>
        {loadingGroups ? (
          <p>Loading...</p>
        ) : groups.length === 0 ? (
          <p style={{ color: '#888' }}>You have no groups yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/groups/${g.id}`}
                  style={{ display: 'block', border: '1px solid #ccc', borderRadius: '6px', padding: '12px', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                  {g.description && <div style={{ color: '#555', marginTop: '4px', fontSize: '14px' }}>{g.description}</div>}
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
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
