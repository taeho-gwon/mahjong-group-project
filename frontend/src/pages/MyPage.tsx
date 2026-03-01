import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMe } from '../hooks/useMe'
import { useMyGroups } from '../hooks/useMyGroups'
import { useCreateGroup } from '../hooks/mutations/useCreateGroup'
import { useAuthStore } from '../stores/authStore'

export default function MyPage() {
  const navigate = useNavigate()
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const { data: user, isLoading: loadingUser } = useMe()
  const { data: groups = [], isLoading: loadingGroups } = useMyGroups()
  const createGroupMutation = useCreateGroup()

  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [groupJoinPolicy, setGroupJoinPolicy] = useState<'public' | 'private'>('public')
  const [uma1st, setUma1st] = useState(30)
  const [uma2nd, setUma2nd] = useState(10)
  const [uma3rd, setUma3rd] = useState(-10)
  const [uma4th, setUma4th] = useState(-30)
  const [createError, setCreateError] = useState('')

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault()
    if (uma1st + uma2nd + uma3rd + uma4th !== 0) {
      setCreateError('우마 합계는 0이어야 합니다.')
      return
    }
    setCreateError('')
    try {
      await createGroupMutation.mutateAsync({
        name: groupName,
        description: groupDesc,
        join_policy: groupJoinPolicy,
        uma: { uma_1st: uma1st, uma_2nd: uma2nd, uma_3rd: uma3rd, uma_4th: uma4th },
      })
      setGroupName('')
      setGroupDesc('')
      setGroupJoinPolicy('public')
      setUma1st(30)
      setUma2nd(10)
      setUma3rd(-10)
      setUma4th(-30)
    } catch {
      setCreateError('Failed to create group')
    }
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
        <h2 className="mt-0 mb-3">My Profile</h2>
        {loadingUser ? (
          <p>Loading...</p>
        ) : user ? (
          <div className="leading-relaxed text-sm">
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        ) : null}
      </section>

      {/* Create Group */}
      <section className="mb-8">
        <h2 className="mt-0 mb-3">Create Group</h2>
        <form onSubmit={handleCreateGroup} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Group name *"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
          />
          <div className="flex gap-4 text-sm items-center">
            <span className="text-gray-600">Join Policy:</span>
            <label className="cursor-pointer">
              <input
                type="radio"
                name="joinPolicy"
                value="public"
                checked={groupJoinPolicy === 'public'}
                onChange={() => setGroupJoinPolicy('public')}
                className="mr-1"
              />
              Public
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                name="joinPolicy"
                value="private"
                checked={groupJoinPolicy === 'private'}
                onChange={() => setGroupJoinPolicy('private')}
                className="mr-1"
              />
              Private
            </label>
          </div>
          <div>
            <div className="text-[13px] text-gray-600 mb-1">
              Uma (합계: {uma1st + uma2nd + uma3rd + uma4th}, 합계 0이어야 함)
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([['1위', uma1st, setUma1st], ['2위', uma2nd, setUma2nd], ['3위', uma3rd, setUma3rd], ['4위', uma4th, setUma4th]] as const).map(
                ([label, value, setter]) => (
                  <div key={label}>
                    <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setter(Number(e.target.value))}
                      className="border border-gray-300 rounded px-1.5 py-1.5 text-sm w-full"
                    />
                  </div>
                )
              )}
            </div>
          </div>
          {createError && <p className="text-red-600 m-0">{createError}</p>}
          <button
            type="submit"
            disabled={createGroupMutation.isPending}
            className="px-4 py-2 cursor-pointer self-start"
          >
            {createGroupMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </form>
      </section>

      {/* My Groups */}
      <section>
        <h2 className="mt-0 mb-3">My Groups</h2>
        {loadingGroups ? (
          <p>Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-400">You have no groups yet.</p>
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
