import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroup } from '../api/groups'
import type { GroupDetailResponse } from '../api/groups'
import { getMe } from '../api/auth'
import { listContests } from '../api/contests'
import type { ContestResponse } from '../api/contests'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [contests, setContests] = useState<ContestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([getGroup(Number(id)), getMe(), listContests(Number(id))])
      .then(([g, user, contestList]) => {
        setGroup(g)
        setMyRole(g.members.find((m) => m.id === user.id)?.role ?? null)
        setContests(contestList)
      })
      .catch(() => setError('Failed to load group'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
        >← Back</button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {myRole !== null && (
            <button
              onClick={() => navigate(`/groups/${id}/games/new`)}
              style={{ fontSize: '14px', padding: '6px 14px', cursor: 'pointer' }}
            >
              게임 등록
            </button>
          )}
          {(myRole === 'owner' || myRole === 'admin') && (
            <button
              onClick={() => navigate(`/groups/${id}/manage`)}
              style={{ fontSize: '14px', padding: '6px 14px', cursor: 'pointer' }}
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ marginTop: '24px' }}>Loading...</p>
      ) : error ? (
        <p style={{ marginTop: '24px', color: 'red' }}>{error}</p>
      ) : group ? (
        <>
          {/* Group Info */}
          <section style={{ marginTop: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <h2 style={{ margin: 0 }}>{group.name}</h2>
              {!group.is_active && (
                <span style={{ fontSize: '12px', color: '#fff', background: '#aaa', borderRadius: '4px', padding: '2px 8px' }}>Inactive</span>
              )}
            </div>
            {group.description && (
              <p style={{ margin: '0 0 16px', color: '#555', fontSize: '14px' }}>{group.description}</p>
            )}
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '2', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <div>
                <strong>Join Policy:</strong>{' '}
                <span style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  padding: '1px 8px',
                  borderRadius: '4px',
                  background: group.join_policy === 'public' ? '#e6f4ea' : '#fce8e8',
                  color: group.join_policy === 'public' ? '#2d7a3a' : '#c0392b',
                }}>
                  {group.join_policy === 'public' ? 'Public' : 'Private'}
                </span>
              </div>
              <div><strong>Owner:</strong> {group.members.find((m) => m.role === 'owner')?.username ?? '-'}</div>
              <div><strong>Members:</strong> {group.members.length}</div>
              <div>
                <strong>Uma:</strong>{' '}
                {[group.uma_1st, group.uma_2nd, group.uma_3rd, group.uma_4th]
                  .map((v, i) => `${i + 1}위 ${v > 0 ? '+' : ''}${v}`)
                  .join(' / ')}
              </div>
              <div><strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}</div>
            </div>
          </section>

          {/* Ranking */}
          {(() => {
            const totalContest = contests.find((c) => c.name === '전체 랭킹')
            if (!totalContest) return null
            return (
              <section style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 12px' }}>랭킹</h3>
                <div
                  onClick={() => navigate(`/contests/${totalContest.id}`)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <span>전체 랭킹</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>점수</span>
                </div>
              </section>
            )
          })()}

          {/* Contests */}
          <section style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>랭킹전</h3>
              {myRole !== null && (
                <button
                  onClick={() => navigate(`/groups/${id}/contests/new`)}
                  style={{ fontSize: '13px', padding: '4px 12px', cursor: 'pointer' }}
                >
                  랭킹전 만들기
                </button>
              )}
            </div>
            {contests.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>아직 랭킹전이 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {contests.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => navigate(`/contests/${c.id}`)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{c.name}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {c.ranking_type === 'match_point' ? '승점' : '점수'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Members */}
          <section>
            <h3 style={{ margin: '0 0 12px' }}>Members</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[...group.members].sort((a, b) => {
                const order = { owner: 0, admin: 1, member: 2 }
                return (order[a.role as keyof typeof order] ?? 3) - (order[b.role as keyof typeof order] ?? 3)
              }).map((m) => (
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
                  <span style={{ fontWeight: m.role === 'owner' ? 'bold' : 'normal' }}>{m.username}</span>
                  <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: m.role === 'owner' ? '#fff3cd' : m.role === 'admin' ? '#e8f0fe' : '#f1f3f4',
                    color: m.role === 'owner' ? '#856404' : m.role === 'admin' ? '#1a56db' : '#555',
                  }}>
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
