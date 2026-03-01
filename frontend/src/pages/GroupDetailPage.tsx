import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useContests } from '../hooks/useContests'
import { useMe } from '../hooks/useMe'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = id ? Number(id) : undefined

  const { data: group, isLoading, isError } = useGroupDetail(groupId)
  const { data: contests = [] } = useContests(groupId)
  const { data: user } = useMe()

  const myRole = group && user ? group.members.find((m) => m.id === user.id)?.role ?? null : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >← Back</button>
        <div className="flex gap-2">
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
        <p className="mt-6 text-red-600">Failed to load group</p>
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
                <strong>Join Policy:</strong>{' '}
                <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                  group.join_policy === 'public'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {group.join_policy === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              <div><strong>Owner:</strong> {group.members.find((m) => m.role === 'owner')?.username ?? '-'}</div>
              <div><strong>Members:</strong> {group.members.length}</div>
              <div><strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}</div>
            </div>
          </section>

          {/* Contests */}
          <section className="mb-8">
            <div className="mb-3">
              <h3 className="m-0">랭킹전</h3>
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

          {/* Members */}
          <section>
            <h3 className="mt-0 mb-3">Members</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
              {[...group.members].sort((a, b) => {
                const order = { owner: 0, admin: 1, member: 2 }
                return (order[a.role as keyof typeof order] ?? 3) - (order[b.role as keyof typeof order] ?? 3)
              }).map((m) => (
                <li
                  key={m.id}
                  className="flex justify-between items-center border border-gray-300 rounded-md px-4 py-2.5 text-sm"
                >
                  <span className={m.role === 'owner' ? 'font-bold' : ''}>{m.username}</span>
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
        </>
      ) : null}
    </div>
  )
}
