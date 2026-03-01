import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useContests } from '../hooks/useContests'
import { useMe } from '../hooks/useMe'
import { useUpdateGroup } from '../hooks/mutations/useUpdateGroup'
import { useUpdateMemberRole } from '../hooks/mutations/useUpdateMemberRole'
import { useRemoveMember } from '../hooks/mutations/useRemoveMember'
import { useGenerateInviteLink } from '../hooks/mutations/useGenerateInviteLink'
import { useLeaveGroup } from '../hooks/mutations/useLeaveGroup'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

export default function GroupManagePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const { data: group, isLoading, isError } = useGroupDetail(groupId)
  const { data: contests = [] } = useContests(groupId)
  const { data: me } = useMe()

  const updateGroupMutation = useUpdateGroup(groupId!)
  const updateRoleMutation = useUpdateMemberRole(groupId!)
  const removeMemberMutation = useRemoveMember(groupId!)
  const generateInviteMutation = useGenerateInviteLink(groupId!)
  const leaveGroupMutation = useLeaveGroup(groupId!)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinPolicy, setJoinPolicy] = useState<'public' | 'private'>('public')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!group || !me) return
    const myMember = group.members.find((m) => m.id === me.id)
    if (!myMember || (myMember.role !== 'owner' && myMember.role !== 'admin')) {
      navigate(`/groups/${id}`, { replace: true })
      return
    }
    setName(group.name)
    setDescription(group.description ?? '')
    setJoinPolicy(group.join_policy)
  }, [group, me, id, navigate])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess(false)
    try {
      await updateGroupMutation.mutateAsync({
        name,
        description: description || null,
        join_policy: joinPolicy,
      })
      setSaveSuccess(true)
    } catch {
      setSaveError('Failed to save changes')
    }
  }

  async function handleGenerateInvite() {
    try {
      const { invite_url, expires_at } = await generateInviteMutation.mutateAsync()
      setInviteUrl(invite_url)
      setInviteExpiresAt(expires_at)
      setCopied(false)
    } catch {
      alert('Failed to generate invite link')
    }
  }

  function handleCopyInvite() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRemoveMember(userId: number) {
    try {
      await removeMemberMutation.mutateAsync(userId)
    } catch {
      alert('Failed to remove member')
    }
  }

  async function handleRoleChange(userId: number, role: 'admin' | 'member') {
    try {
      await updateRoleMutation.mutateAsync({ userId, role })
    } catch {
      alert('Failed to update role')
    }
  }

  function handleLeave() {
    if (!window.confirm('정말 이 그룹에서 탈퇴하시겠습니까?')) return
    leaveGroupMutation.mutate()
  }

  const myRole = group && me ? group.members.find((m) => m.id === me.id)?.role : undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(`/groups/${id}`)}
        className="text-sm bg-transparent border-none cursor-pointer p-0"
      >
        ← Back
      </button>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="mt-6 text-red-600">Failed to load group</p>
      ) : group ? (
        <>
          <h2 className="mt-6 mb-7">Manage: {group.name}</h2>

          {/* Group Settings */}
          <section className="mb-10">
            <h3 className="mt-0 mb-4 text-base">Group Settings</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-[13px] text-gray-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSaveSuccess(false) }}
                  required
                  className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setSaveSuccess(false) }}
                  className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-600 mb-1.5">Join Policy</label>
                <div className="flex gap-4 text-sm items-center">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="joinPolicy"
                      value="public"
                      checked={joinPolicy === 'public'}
                      onChange={() => { setJoinPolicy('public'); setSaveSuccess(false) }}
                      className="mr-1"
                    />
                    Public
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="joinPolicy"
                      value="private"
                      checked={joinPolicy === 'private'}
                      onChange={() => { setJoinPolicy('private'); setSaveSuccess(false) }}
                      className="mr-1"
                    />
                    Private
                  </label>
                </div>
              </div>
              {saveError && <p className="text-red-600 m-0 text-sm">{saveError}</p>}
              {saveSuccess && <p className="text-green-700 m-0 text-sm">Saved successfully.</p>}
              <button
                type="submit"
                disabled={updateGroupMutation.isPending}
                className="px-4 py-2 cursor-pointer self-start"
              >
                {updateGroupMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </section>

          {/* Contests */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base">랭킹전 관리</h3>
              <button
                onClick={() => navigate(`/groups/${id}/contests/new`)}
                className="text-[13px] px-3 py-1 cursor-pointer"
              >
                랭킹전 만들기
              </button>
            </div>
            {contests.length === 0 ? (
              <p className="text-sm text-gray-400 m-0">아직 랭킹전이 없습니다.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                {contests.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => navigate(`/contests/${c.id}`)}
                    className="flex justify-between items-center border border-gray-300 rounded-md px-4 py-2.5 text-sm cursor-pointer"
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-gray-400">
                      {c.ranking_type === 'match_point' ? '승점' : '점수'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Game Record Management */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base">기록 관리</h3>
              <button
                onClick={() => navigate(`/groups/${id}/records/manage`)}
                className="text-[13px] px-3 py-1 cursor-pointer"
              >
                기록 관리 페이지
              </button>
            </div>
            <p className="text-sm text-gray-400 m-0">게임 기록 수정 및 삭제는 기록 관리 페이지에서 할 수 있습니다.</p>
          </section>

          {/* Invite Link */}
          <section className="mb-10">
            <h3 className="mt-0 mb-4 text-base">Invite Link</h3>
            <button
              onClick={handleGenerateInvite}
              disabled={generateInviteMutation.isPending}
              className="px-3.5 py-1.5 cursor-pointer text-sm"
            >
              {generateInviteMutation.isPending ? 'Generating...' : inviteUrl ? 'Regenerate Link' : '초대 링크 생성'}
            </button>
            {inviteUrl && (
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 break-all">{inviteUrl}</span>
                  <button
                    onClick={handleCopyInvite}
                    className="shrink-0 text-xs px-2 py-0.5 cursor-pointer border border-gray-400 rounded"
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
                {inviteExpiresAt && (
                  <p className="text-xs text-gray-400 m-0">
                    만료: {new Date(inviteExpiresAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Member Management */}
          <section>
            <h3 className="mt-0 mb-4 text-base">Members ({group.members.length})</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {[...group.members].sort((a, b) => {
                const order = { owner: 0, admin: 1, member: 2 }
                return (order[a.role as keyof typeof order] ?? 3) - (order[b.role as keyof typeof order] ?? 3)
              }).map((m) => {
                const isMe = m.id === me?.id
                const isMemberOwner = m.role === 'owner'
                const canKick = !isMe && m.role === 'member' && (myRole === 'owner' || myRole === 'admin')
                const canChangeRole = !isMe && !isMemberOwner && myRole === 'owner'

                return (
                  <li
                    key={m.id}
                    className="flex justify-between items-center border border-gray-300 rounded-md px-4 py-2.5 text-sm"
                  >
                    <span className={isMemberOwner ? 'font-bold' : ''}>
                      <Link to={`/users/${m.id}`} className="no-underline text-inherit">{m.username}</Link>{isMe && <span className="text-gray-400 text-xs"> (me)</span>}
                    </span>
                    <div className="flex gap-2 items-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        m.role === 'owner'
                          ? 'bg-yellow-100 text-yellow-700'
                          : m.role === 'admin'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                      {canChangeRole && (
                        <button
                          onClick={() => handleRoleChange(m.id, m.role === 'member' ? 'admin' : 'member')}
                          className="text-xs px-2 py-0.5 cursor-pointer bg-transparent border border-gray-600 rounded"
                        >
                          {m.role === 'member' ? 'Make Admin' : 'Make Member'}
                        </button>
                      )}
                      {canKick && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-xs px-2 py-0.5 cursor-pointer text-red-600 bg-transparent border border-red-600 rounded"
                        >
                          강퇴
                        </button>
                      )}
                      {isMe && myRole !== 'owner' && (
                        <button
                          onClick={handleLeave}
                          className="text-xs px-2 py-0.5 cursor-pointer text-red-600 bg-transparent border border-red-600 rounded"
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
