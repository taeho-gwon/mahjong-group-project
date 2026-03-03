import { useState } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useEvents } from '../hooks/useEvents'
import { useMe } from '../hooks/useMe'
import { useLeaveGroup } from '../hooks/mutations/useLeaveGroup'
import { getDisplayName } from '../api/groups'
import { ApiError } from '../api/errors'
import ConfirmModal from '../components/ConfirmModal'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const { data: group, isLoading, isError, error } = useGroupDetail(groupId)
  const { data: events = [] } = useEvents(groupId)
  const { data: user } = useMe()
  const leaveGroupMutation = useLeaveGroup(groupId!)

  const activeEvents = events.filter((c) => !c.is_closed)
  const closedEvents = events.filter((c) => c.is_closed)
  const [showClosed, setShowClosed] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const myRole = group && user ? group.members.find((m) => m.id === user.id)?.role ?? null : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >← Back</button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/groups/${id}/ranking`)}
            className="text-sm px-3.5 py-1.5 cursor-pointer"
          >
            랭킹
          </button>
          {myRole !== null && (
            <button
              onClick={() => navigate(`/groups/${id}/games/new`)}
              className="text-sm px-3.5 py-1.5 cursor-pointer"
            >
              게임 등록
            </button>
          )}
          {(myRole === 'owner' || myRole === 'admin') && (
            <button
              onClick={() => navigate(`/groups/${id}/manage`)}
              className="text-sm px-3.5 py-1.5 cursor-pointer"
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        error instanceof ApiError && error.isForbidden ? (
          <Navigate to="/forbidden" replace />
        ) : error instanceof ApiError && error.isNotFound ? (
          <Navigate to="/not-found" replace />
        ) : (
          <p className="mt-6 text-red-600">모임 정보를 불러올 수 없습니다.</p>
        )
      ) : group ? (
        <>
          {/* Group Info */}
          <section className="mt-6 mb-8">
            <div className="flex items-center gap-2.5 mb-2">
              <h2 className="m-0">{group.name}</h2>
              {!group.is_active && (
                <span className="text-xs text-white bg-gray-400 rounded px-2 py-0.5">Inactive</span>
              )}
            </div>
            {group.description && (
              <p className="m-0 mb-4 text-gray-600 text-sm">{group.description}</p>
            )}
            <div className="text-[13px] text-gray-600 leading-loose border-t border-gray-100 pt-3">
              <div>
                <strong>가입 정책:</strong>{' '}
                <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                  group.join_policy === 'public'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {group.join_policy === 'public' ? '공개' : '비공개'}
                </span>
              </div>
              <div><strong>소유자:</strong> {(() => { const owner = group.members.find((m) => m.role === 'owner'); return owner ? getDisplayName(owner) : '-' })()}</div>
              <div><strong>멤버:</strong> {group.members.length}명</div>
              <div><strong>생성일:</strong> {new Date(group.created_at).toLocaleDateString()}</div>
            </div>
          </section>

          {/* Events */}
          <section className="mb-8">
            <div className="mb-3">
              <h3 className="m-0">이벤트</h3>
            </div>
            {activeEvents.length === 0 ? (
              <p className="text-sm text-gray-400 m-0">활성 이벤트가 없습니다.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                {activeEvents.map((c) => (
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

            {closedEvents.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowClosed((prev) => !prev)}
                  className="text-sm text-gray-500 bg-transparent border-none cursor-pointer p-0"
                >
                  {showClosed ? '▾' : '▸'} 완료된 이벤트 ({closedEvents.length})
                </button>
                {showClosed && (
                  <ul className="list-none p-0 m-0 mt-2 flex flex-col gap-1.5">
                    {closedEvents.map((c) => (
                      <li
                        key={c.id}
                        onClick={() => navigate(`/events/${c.id}`)}
                        className="flex justify-between items-center border border-gray-200 rounded-md px-4 py-2.5 text-sm cursor-pointer opacity-60"
                      >
                        <span className="flex items-center gap-2">
                          {c.name}
                          <span className="bg-gray-500 text-white text-xs px-1.5 py-0.5 rounded">마감</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {c.ranking_type === 'match_point' ? '승점' : '점수'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Members */}
          <section>
            <h3 className="mt-0 mb-3">멤버</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
              {[...group.members].sort((a, b) => {
                const order = { owner: 0, admin: 1, member: 2 }
                return (order[a.role as keyof typeof order] ?? 3) - (order[b.role as keyof typeof order] ?? 3)
              }).map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center border border-gray-300 rounded-md px-4 py-2.5 text-sm"
                >
                  <Link to={`/users/${m.id}`} className={`no-underline text-inherit ${m.role === 'owner' ? 'font-bold' : ''}`}>{getDisplayName(m)}</Link>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    m.role === 'owner'
                      ? 'bg-yellow-100 text-yellow-700'
                      : m.role === 'admin'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Leave Group */}
          {myRole && myRole !== 'owner' && (
            <section className="mt-10 border-t border-gray-100 pt-6">
              <button
                onClick={() => setShowLeaveModal(true)}
                disabled={leaveGroupMutation.isPending}
                className="text-sm px-4 py-2 cursor-pointer text-red-600 border border-red-600 rounded bg-transparent"
              >
                {leaveGroupMutation.isPending ? '탈퇴 중...' : '모임 탈퇴'}
              </button>
              <ConfirmModal
                open={showLeaveModal}
                title="모임 탈퇴"
                description="정말 이 모임에서 탈퇴하시겠습니까?"
                confirmLabel="탈퇴"
                onConfirm={() => { setShowLeaveModal(false); leaveGroupMutation.mutate() }}
                onCancel={() => setShowLeaveModal(false)}
                destructive
              />
            </section>
          )}
        </>
      ) : null}
    </div>
  )
}
