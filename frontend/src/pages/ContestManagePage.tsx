import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getContest, updateContest, deleteContest } from '../api/contests'
import type { RankingType } from '../api/contests'
import { getMe } from '../api/auth'
import { getGroup } from '../api/groups'

export default function ContestManagePage() {
  const { contestId } = useParams<{ contestId: string }>()
  const navigate = useNavigate()

  const [groupId, setGroupId] = useState<number | null>(null)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [rankingType, setRankingType] = useState<RankingType>('score')
  const [uma, setUma] = useState({ uma_1st: 30, uma_2nd: 10, uma_3rd: -10, uma_4th: -30 })
  const [scoring, setScoring] = useState({ scoring_1st: 4, scoring_2nd: 2, scoring_3rd: 1, scoring_4th: 0 })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const umaSum = uma.uma_1st + uma.uma_2nd + uma.uma_3rd + uma.uma_4th

  useEffect(() => {
    if (!contestId) return
    getContest(Number(contestId))
      .then((c) => {
        if (c.group_id === null) throw new Error('No group')
        return Promise.all([Promise.resolve(c), getMe(), getGroup(c.group_id)])
      })
      .then(([c, user, group]) => {
        const role = group.members.find((m) => m.id === user.id)?.role ?? null
        if (role !== 'owner' && role !== 'admin') {
          navigate(`/contests/${contestId}`, { replace: true })
          return
        }
        setGroupId(c.group_id)
        setMyRole(role)
        setName(c.name)
        setRankingType(c.ranking_type)
        setUma({ uma_1st: c.uma_1st, uma_2nd: c.uma_2nd, uma_3rd: c.uma_3rd, uma_4th: c.uma_4th })
        setScoring({ scoring_1st: c.scoring_1st, scoring_2nd: c.scoring_2nd, scoring_3rd: c.scoring_3rd, scoring_4th: c.scoring_4th })
      })
      .catch(() => setError('Failed to load contest'))
      .finally(() => setLoading(false))
  }, [contestId, navigate])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (umaSum !== 0) {
      setSaveError(`우마 합계가 0이어야 합니다. 현재: ${umaSum}`)
      return
    }
    setSaveError('')
    setSaveSuccess(false)
    setSaving(true)
    try {
      await updateContest(Number(contestId), {
        name,
        ranking_type: rankingType,
        ...uma,
        ...scoring,
      })
      setSaveSuccess(true)
    } catch {
      setSaveError('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('이 랭킹전을 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      await deleteContest(Number(contestId))
      navigate(groupId !== null ? `/groups/${groupId}` : '/', { replace: true })
    } catch {
      setError('삭제에 실패했습니다.')
      setDeleting(false)
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(`/contests/${contestId}`)}
          style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: '0 0 0 16px' }}>랭킹전 관리</h2>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : myRole ? (
        <>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaveSuccess(false) }}
                required
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>랭킹 방식</label>
              <select
                value={rankingType}
                onChange={(e) => { setRankingType(e.target.value as RankingType); setSaveSuccess(false) }}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '14px' }}
              >
                <option value="score">점수 합산 (score)</option>
                <option value="match_point">승점 (match_point)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>
                우마{' '}
                <span style={{ fontWeight: 'normal', color: umaSum === 0 ? '#2d7a3a' : '#c0392b', fontSize: '13px' }}>
                  (합계: {umaSum > 0 ? '+' : ''}{umaSum})
                </span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                {(['uma_1st', 'uma_2nd', 'uma_3rd', 'uma_4th'] as const).map((key, idx) => (
                  <div key={key}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'center' }}>{idx + 1}위</div>
                    <input
                      type="number"
                      value={uma[key]}
                      onChange={(e) => { setUma((prev) => ({ ...prev, [key]: Number(e.target.value) })); setSaveSuccess(false) }}
                      style={{ width: '100%', padding: '6px', boxSizing: 'border-box', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {rankingType === 'match_point' && (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>승점 배점</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  {(['scoring_1st', 'scoring_2nd', 'scoring_3rd', 'scoring_4th'] as const).map((key, idx) => (
                    <div key={key}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', textAlign: 'center' }}>{idx + 1}위</div>
                      <input
                        type="number"
                        value={scoring[key]}
                        onChange={(e) => { setScoring((prev) => ({ ...prev, [key]: Number(e.target.value) })); setSaveSuccess(false) }}
                        style={{ width: '100%', padding: '6px', boxSizing: 'border-box', textAlign: 'center' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {saveError && <p style={{ color: 'red', margin: 0, fontSize: '14px' }}>{saveError}</p>}
            {saveSuccess && <p style={{ color: '#2d7a3a', margin: 0, fontSize: '14px' }}>저장되었습니다.</p>}

            <button
              type="submit"
              disabled={saving}
              style={{ padding: '8px 20px', fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </form>

          <hr style={{ margin: '40px 0', borderColor: '#eee' }} />

          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#c0392b' }}>위험 구역</h3>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ padding: '8px 20px', fontSize: '14px', cursor: deleting ? 'not-allowed' : 'pointer', color: '#c0392b', borderColor: '#c0392b' }}
            >
              {deleting ? '삭제 중...' : '랭킹전 삭제'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
