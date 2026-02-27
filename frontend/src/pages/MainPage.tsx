import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../api/auth'
import type { UserResponse } from '../api/auth'
import { getGroups, createGroup } from '../api/groups'
import type { GroupResponse } from '../api/groups'

export default function MainPage() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)

  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
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

    getGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoadingGroups(false))
  }, [navigate])

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const group = await createGroup(groupName, groupDesc)
      setGroups((prev) => [group, ...prev])
      setGroupName('')
      setGroupDesc('')
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
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 16px' }}>
      {/* Personal Info */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>My Profile</h2>
          <button onClick={handleLogout} style={{ padding: '6px 12px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
        {loadingUser ? (
          <p>Loading...</p>
        ) : user ? (
          <div style={{ marginTop: '12px', lineHeight: '1.8' }}>
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Email:</strong> {user.email}</div>
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
          {createError && <p style={{ color: 'red', margin: 0 }}>{createError}</p>}
          <button type="submit" disabled={creating} style={{ padding: '8px', cursor: 'pointer', alignSelf: 'flex-start' }}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>

      {/* Groups List */}
      <section>
        <h2 style={{ margin: '0 0 12px' }}>My Groups</h2>
        {loadingGroups ? (
          <p>Loading...</p>
        ) : groups.length === 0 ? (
          <p style={{ color: '#888' }}>You have no groups yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map((g) => (
              <li key={g.id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontWeight: 'bold' }}>{g.name}</div>
                {g.description && <div style={{ color: '#555', marginTop: '4px' }}>{g.description}</div>}
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  Created {new Date(g.created_at).toLocaleDateString()}
                  {g.owner_id === user?.id && ' · Owner'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
