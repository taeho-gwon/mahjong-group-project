import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useEvents } from '../hooks/useEvents'
import { useMe } from '../hooks/useMe'
import { useUpdateGroup } from '../hooks/mutations/useUpdateGroup'
import { useUpdateMemberRole } from '../hooks/mutations/useUpdateMemberRole'
import { useUpdateMemberNickname } from '../hooks/mutations/useUpdateMemberNickname'
import { useRemoveMember } from '../hooks/mutations/useRemoveMember'
import { useGenerateInviteLink } from '../hooks/mutations/useGenerateInviteLink'
import { useLeaveGroup } from '../hooks/mutations/useLeaveGroup'
import { useDeleteGroup } from '../hooks/mutations/useDeleteGroup'
import { getDisplayName } from '../api/groups'
import ConfirmModal from '../components/ConfirmModal'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

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
  const { data: events = [] } = useEvents(groupId)
  const { data: me } = useMe()

  const updateGroupMutation = useUpdateGroup(groupId!)
  const updateRoleMutation = useUpdateMemberRole(groupId!)
  const removeMemberMutation = useRemoveMember(groupId!)
  const updateNicknameMutation = useUpdateMemberNickname(groupId!)
  const generateInviteMutation = useGenerateInviteLink(groupId!)
  const leaveGroupMutation = useLeaveGroup(groupId!)
  const deleteGroupMutation = useDeleteGroup()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinPolicy, setJoinPolicy] = useState<'public' | 'private'>('public')
  const [weeklyStartDay, setWeeklyStartDay] = useState(0)
  const [monthlyStartDay, setMonthlyStartDay] = useState(1)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [editNicknameUserId, setEditNicknameUserId] = useState<number | null>(null)
  const [nicknameInput, setNicknameInput] = useState('')

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
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
    setWeeklyStartDay(group.weekly_start_day)
    setMonthlyStartDay(group.monthly_start_day)
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
        weekly_start_day: weeklyStartDay,
        monthly_start_day: monthlyStartDay,
      })
      setSaveSuccess(true)
    } catch {
      setSaveError('저장에 실패했습니다.')
    }
  }

  async function handleGenerateInvite() {
    try {
      const { invite_url, expires_at } = await generateInviteMutation.mutateAsync()
      setInviteUrl(invite_url)
      setInviteExpiresAt(expires_at)
      setCopied(false)
    } catch {
      // error toast handled by mutation hook
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
      // error toast handled by mutation hook
    }
  }

  async function handleRoleChange(userId: number, role: 'admin' | 'member') {
    try {
      await updateRoleMutation.mutateAsync({ userId, role })
    } catch {
      // error toast handled by mutation hook
    }
  }

  function handleLeave() {
    setShowLeaveModal(false)
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
        <p className="mt-6 text-red-600">모임 정보를 불러올 수 없습니다.</p>
      ) : group ? (
        <>
          <h2 className="mt-6 mb-7">모임 관리: {group.name}</h2>

          {/* Group Settings */}
          <section className="mb-10">
            <h3 className="mt-0 mb-4 text-base">모임 설정</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-[13px] text-gray-600 mb-1">이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSaveSuccess(false) }}
                  required
                  className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-600 mb-1">설명</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setSaveSuccess(false) }}
                  className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-600 mb-1.5">가입 정책</label>
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
                    공개
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
                    비공개
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[13px] text-gray-600 mb-1">주간 랭킹 시작 요일</label>
                <select
                  value={weeklyStartDay}
                  onChange={(e) => { setWeeklyStartDay(Number(e.target.value)); setSaveSuccess(false) }}
                  className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
                >
                  {WEEKDAYS.map((day, idx) => (
                    <option key={idx} value={idx}>{day}요일</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-gray-600 mb-1">월간 랭킹 시작일</label>
                <select
                  value={monthlyStartDay}
                  onChange={(e) => { setMonthlyStartDay(Number(e.target.value)); setSaveSuccess(false) }}
                  className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
              </div>
              {saveError && <p className="text-red-600 m-0 text-sm">{saveError}</p>}
              {saveSuccess && <p className="text-green-700 m-0 text-sm">저장되었습니다.</p>}
              <button
                type="submit"
                disabled={updateGroupMutation.isPending}
                className="px-4 py-2 cursor-pointer self-start"
              >
                {updateGroupMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </form>
          </section>

          {/* Events */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base">이벤트 관리</h3>
              <button
                onClick={() => navigate(`/groups/${id}/events/new`)}
                className="text-[13px] px-3 py-1 cursor-pointer"
              >
                이벤트 만들기
              </button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-gray-400 m-0">아직 이벤트가 없습니다.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                {events.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => navigate(`/events/${c.id}`)}
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
            <h3 className="mt-0 mb-4 text-base">초대 링크</h3>
            <button
              onClick={handleGenerateInvite}
              disabled={generateInviteMutation.isPending}
              className="px-3.5 py-1.5 cursor-pointer text-sm"
            >
              {generateInviteMutation.isPending ? '생성 중...' : inviteUrl ? '링크 재생성' : '초대 링크 생성'}
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
            <h3 className="mt-0 mb-4 text-base">멤버 ({group.members.length})</h3>
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
                    <div className="flex flex-col">
                      <span className={isMemberOwner ? 'font-bold' : ''}>
                        <Link to={`/users/${m.id}`} className="no-underline text-inherit">{getDisplayName(m)}</Link>{isMe && <span className="text-gray-400 text-xs"> (me)</span>}
                      </span>
                      {editNicknameUserId === m.id ? (
                        <span className="flex items-center gap-1 mt-1">
                          <input
                            type="text"
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            maxLength={50}
                            placeholder="닉네임"
                            className="border border-gray-300 rounded px-1.5 py-0.5 text-xs w-28"
                          />
                          <button
                            onClick={async () => {
                              await updateNicknameMutation.mutateAsync({ userId: m.id, nickname: nicknameInput.trim() || null })
                              setEditNicknameUserId(null)
                            }}
                            disabled={updateNicknameMutation.isPending}
                            className="text-xs px-1.5 py-0.5 cursor-pointer"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditNicknameUserId(null)}
                            className="text-xs px-1.5 py-0.5 cursor-pointer bg-transparent border border-gray-300 rounded"
                          >
                            취소
                          </button>
                        </span>
                      ) : (isMe || myRole === 'owner' || myRole === 'admin') ? (
                        <button
                          onClick={() => { setEditNicknameUserId(m.id); setNicknameInput(m.nickname ?? '') }}
                          className="text-xs text-gray-400 bg-transparent border-none cursor-pointer p-0 mt-0.5 text-left"
                        >
                          {m.nickname ? `닉네임: ${m.nickname}` : '닉네임 설정'}
                        </button>
                      ) : m.nickname ? (
                        <span className="text-xs text-gray-400 mt-0.5">닉네임: {m.nickname}</span>
                      ) : null}
                    </div>
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
                          {m.role === 'member' ? '관리자로 변경' : '멤버로 변경'}
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
                          onClick={() => setShowLeaveModal(true)}
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

          {/* Danger Zone — owner only */}
          {myRole === 'owner' && (
            <section className="mt-10 border-t border-gray-100 pt-6">
              <h3 className="mt-0 mb-3 text-base text-red-600">위험 구역</h3>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={deleteGroupMutation.isPending}
                className="px-5 py-2 text-sm cursor-pointer text-red-600 border border-red-600 rounded bg-transparent"
              >
                {deleteGroupMutation.isPending ? '삭제 중...' : '모임 삭제'}
              </button>
              <ConfirmModal
                open={showDeleteModal}
                title="모임 삭제"
                description="정말로 이 모임을 삭제하시겠습니까? 모든 데이터가 삭제됩니다."
                confirmLabel="삭제"
                onConfirm={() => { setShowDeleteModal(false); deleteGroupMutation.mutate(groupId!) }}
                onCancel={() => setShowDeleteModal(false)}
                destructive
              />
            </section>
          )}

          <ConfirmModal
            open={showLeaveModal}
            title="모임 탈퇴"
            description="정말 이 모임에서 탈퇴하시겠습니까?"
            confirmLabel="탈퇴"
            onConfirm={handleLeave}
            onCancel={() => setShowLeaveModal(false)}
            destructive
          />
        </>
      ) : null}
    </div>
  )
}
