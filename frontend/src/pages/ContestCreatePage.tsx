import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createContest } from '../api/contests'
import type { RankingType } from '../api/contests'

export default function ContestCreatePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [rankingType, setRankingType] = useState<RankingType>('score')
  const [uma, setUma] = useState({ uma_1st: 30, uma_2nd: 10, uma_3rd: -10, uma_4th: -30 })
  const [scoring, setScoring] = useState({ scoring_1st: 4, scoring_2nd: 2, scoring_3rd: 1, scoring_4th: 0 })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const umaSum = uma.uma_1st + uma.uma_2nd + uma.uma_3rd + uma.uma_4th

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('이름을 입력하세요.')
      return
    }
    if (umaSum !== 0) {
      setError(`우마 합계가 0이어야 합니다. 현재 합계: ${umaSum}`)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await createContest({
        name: name.trim(),
        group_id: id ? Number(id) : null,
        ranking_type: rankingType,
        ...uma,
        ...scoring,
      })
      navigate(`/groups/${id}`)
    } catch {
      setError('랭킹전 생성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
        >
          ← Back
        </button>
        <h2 style={{ margin: '0 0 0 16px' }}>랭킹전 만들기</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="랭킹전 이름"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', fontSize: '14px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>랭킹 방식</label>
          <select
            value={rankingType}
            onChange={(e) => setRankingType(e.target.value as RankingType)}
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
                  onChange={(e) => setUma((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
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
                    onChange={(e) => setScoring((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '6px', boxSizing: 'border-box', textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: '8px 20px', fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? '생성 중...' : '생성'}
          </button>
        </div>
      </form>
    </div>
  )
}
