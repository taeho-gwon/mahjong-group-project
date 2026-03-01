import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroup, updateGroup, removeMember, updateMemberRole, generateInviteLink, leaveGroup } from '../api/groups'
import type { GroupDetailResponse } from '../api/groups'
import { getMe } from '../api/auth'
import type { UserResponse } from '../api/auth'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

const ROLE_STYLE: Record<string, { background: string; color: string }> = {
  owner: { background: '#fff3cd', color: '#856404' },
  admin: { background: '#e8f0fe', color: '#1a56db' },
  member: { background: '#f1f3f4', color: '#555' },
}

export default function GroupManagePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [me, setMe] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinPolicy, setJoinPolicy] = useState<'public' | 'private'>('public')
  const [uma1st, setUma1st] = useState(30)
  const [uma2nd, setUma2nd] = useState(10)
  const [uma3rd, setUma3rd] = useState(-10)
  const [uma4th, setUma4th] = useState(-30)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getGroup(Number(id)), getMe()])
      .then(([g, user]) => {
        const myMember = g.members.find((m) => m.id === user.id)
        if (!myMember || (myMember.role !== 'owner' && myMember.role !== 'admin')) {
          navigate(`/groups/${id}`, { replace: true })
          return
        }
        setGroup(g)
        setMe(user)
        setName(g.name)
        setDescription(g.description ?? '')
        setJoinPolicy(g.join_policy)
        setUma1st(g.uma_1st)
        setUma2nd(g.uma_2nd)
        setUma3rd(g.uma_3rd)
        setUma4th(g.uma_4th)
      })
      .catch(() => setError('Failed to load group'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!group) return
    if (uma1st + uma2nd + uma3rd + uma4th !== 0) {
      setSaveError('우마 합계는 0이어야 합니다.')
      return
    }
    setSaveError('')
    setSaveSuccess(false)
    setSaving(true)
    try {
      const updated = await updateGroup(group.id, {
        name,
        description: description || null,
        join_policy: joinPolicy,
        uma_1st: uma1st,
        uma_2nd: uma2nd,
        uma_3rd: uma3rd,
        uma_4th: uma4th,
      })
      setGroup((prev) => prev ? { ...prev, ...updated } : prev)
      setSaveSuccess(true)
    } catch {
      setSaveError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateInvite() {
    if (!group) return
    setGeneratingInvite(true)
    try {
      const { invite_token } = await generateInviteLink(group.id)
      setInviteToken(invite_token)
      setCopied(false)
    } catch {
      alert('Failed to generate invite link')
    } finally {
      setGeneratingInvite(false)
    }
  }

  async function handleCopyInvite() {
    if (!group) return
    let token = inviteToken
    if (!token) {
      setGeneratingInvite(true)
      try {
        const res = await generateInviteLink(group.id)
        token = res.invite_token
        setInviteToken(token)
      } catch {
        alert('Failed to generate invite link')
        return
      } finally {
        setGeneratingInvite(false)
      }
    }
    navigator.clipboard.writeText(`${window.location.origin}/join?token=${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRemoveMember(userId: number) {
    if (!group) return
    try {
      await removeMember(group.id, userId)
      setGroup((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.id !== userId) } : prev)
    } catch {
      alert('Failed to remove member')
    }
  }

  async function handleRoleChange(userId: number, role: 'admin' | 'member') {
    if (!group) return
    try {
      const updated = await updateMemberRole(group.id, userId, role)
      setGroup((prev) => prev
        ? { ...prev, members: prev.members.map((m) => m.id === userId ? { ...m, role: updated.role } : m) }
        : prev
      )
    } catch {
      alert('Failed to update role')
    }
  }

  async function handleLeave() {
    if (!group) return
    try {
      await leaveGroup(group.id)
      navigate('/', { replace: true })
    } catch {
      alert('Failed to leave group')
    }
  }

  const myRole = group && me ? group.members.find((m) => m.id === me.id)?.role : undefined

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      <button
        onClick={() => navigate(`/groups/${id}`)}
        style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
      >
        ← Back
      </button>

      {loading ? (
        <p style={{ marginTop: '24px' }}>Loading...</p>
      ) : error ? (
        <p style={{ marginTop: '24px', color: 'red' }}>{error}</p>
      ) : group ? (
        <>
          <h2 style={{ marginTop: '24px', marginBottom: '28px' }}>Manage: {group.name}</h2>

          {/* Group Settings */}
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Group Settings</h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' }}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSaveSuccess(false) }}
                  required
                  style={{ padding: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setSaveSuccess(false) }}
                  style={{ padding: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px' }}>Join Policy</label>
                <div style={{ display: 'flex', gap: '16px', fontSize: '14px', alignItems: 'center' }}>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="joinPolicy"
                      value="public"
                      checked={joinPolicy === 'public'}
                      onChange={() => { setJoinPolicy('public'); setSaveSuccess(false) }}
                      style={{ marginRight: '4px' }}
                    />
                    Public
                  </label>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="joinPolicy"
                      value="private"
                      checked={joinPolicy === 'private'}
                      onChange={() => { setJoinPolicy('private'); setSaveSuccess(false) }}
                      style={{ marginRight: '4px' }}
                    />
                    Private
                  </label>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                  Uma (합계: {uma1st + uma2nd + uma3rd + uma4th}, 합계 0이어야 함)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {([['1위', uma1st, setUma1st], ['2위', uma2nd, setUma2nd], ['3위', uma3rd, setUma3rd], ['4위', uma4th, setUma4th]] as const).map(
                    ([label, value, setter]) => (
                      <div key={label}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '2px' }}>{label}</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => { setter(Number(e.target.value)); setSaveSuccess(false) }}
                          style={{ padding: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
              {saveError && <p style={{ color: 'red', margin: 0, fontSize: '14px' }}>{saveError}</p>}
              {saveSuccess && <p style={{ color: '#2d7a3a', margin: 0, fontSize: '14px' }}>Saved successfully.</p>}
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '8px 16px', cursor: 'pointer', alignSelf: 'flex-start' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </section>

          {/* Invite Link */}
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Invite Link</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCopyInvite} disabled={generatingInvite} style={{ padding: '6px 14px', cursor: 'pointer', fontSize: '14px' }}>
                {generatingInvite ? 'Generating...' : copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={handleGenerateInvite} disabled={generatingInvite} style={{ padding: '6px 14px', cursor: 'pointer', fontSize: '14px' }}>
                {generatingInvite ? 'Generating...' : 'Regenerate Link'}
              </button>
            </div>
          </section>

          {/* Member Management */}
          <section>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Members ({group.members.length})</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.members.map((m) => {
                const isMe = m.id === me?.id
                const isMemberOwner = m.role === 'owner'
                const canKick = !isMe && m.role === 'member' && (myRole === 'owner' || myRole === 'admin')
                const canChangeRole = !isMe && !isMemberOwner && myRole === 'owner'

                return (
                  <li
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '14px',
                    }}
                  >
                    <span style={{ fontWeight: isMemberOwner ? 'bold' : 'normal' }}>
                      {m.username}{isMe && <span style={{ color: '#888', fontSize: '12px' }}> (me)</span>}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        ...ROLE_STYLE[m.role],
                      }}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                      {canChangeRole && (
                        <button
                          onClick={() => handleRoleChange(m.id, m.role === 'member' ? 'admin' : 'member')}
                          style={{
                            fontSize: '12px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            background: 'none',
                            border: '1px solid #555',
                            borderRadius: '4px',
                          }}
                        >
                          {m.role === 'member' ? 'Make Admin' : 'Make Member'}
                        </button>
                      )}
                      {canKick && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          style={{
                            fontSize: '12px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            color: '#c0392b',
                            background: 'none',
                            border: '1px solid #c0392b',
                            borderRadius: '4px',
                          }}
                        >
                          강퇴
                        </button>
                      )}
                      {isMe && myRole !== 'owner' && (
                        <button
                          onClick={handleLeave}
                          style={{
                            fontSize: '12px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            color: '#c0392b',
                            background: 'none',
                            border: '1px solid #c0392b',
                            borderRadius: '4px',
                          }}
                        >
                          탈퇴
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  )
}
