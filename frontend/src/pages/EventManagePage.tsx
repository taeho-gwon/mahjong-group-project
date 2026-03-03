import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import type { RankingType, EventType } from '../api/events'
import { useEvent } from '../hooks/useEvent'
import { useGroupDetail } from '../hooks/useGroupDetail'
import { useMe } from '../hooks/useMe'
import { useUpdateEvent } from '../hooks/mutations/useUpdateEvent'
import { useDeleteEvent } from '../hooks/mutations/useDeleteEvent'
import { useCloseEvent } from '../hooks/mutations/useCloseEvent'
import ConfirmModal from '../components/ConfirmModal'

export default function EventManagePage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const id = eventId ? Number(eventId) : undefined

  const { data: event, isLoading, isError } = useEvent(id)
  const { data: group } = useGroupDetail(event?.group_id ?? undefined)
  const { data: me } = useMe()

  const updateEventMutation = useUpdateEvent(id!)
  const deleteEventMutation = useDeleteEvent(event?.group_id)
  const closeEventMutation = useCloseEvent(event?.group_id)

  const [name, setName] = useState('')
  const [eventType, setEventType] = useState<EventType>('regular')
  const [rankingType, setRankingType] = useState<RankingType>('score')
  const [uma, setUma] = useState({ uma_1st: 30, uma_2nd: 10, uma_3rd: -10, uma_4th: -30 })
  const [scoring, setScoring] = useState({ scoring_1st: 4, scoring_2nd: 2, scoring_3rd: 1, scoring_4th: 0 })
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

  const myRole = group && me ? group.members.find((m) => m.id === me.id)?.role ?? null : null

  const umaSum = uma.uma_1st + uma.uma_2nd + uma.uma_3rd + uma.uma_4th

  useEffect(() => {
    if (!event || !group || !me) return
    const role = group.members.find((m) => m.id === me.id)?.role ?? null
    if (role !== 'owner' && role !== 'admin') {
      navigate(`/events/${eventId}`, { replace: true })
      return
    }
    setName(event.name)
    setEventType(event.event_type)
    setRankingType(event.ranking_type)
    setUma({ uma_1st: event.uma_1st, uma_2nd: event.uma_2nd, uma_3rd: event.uma_3rd, uma_4th: event.uma_4th })
    setScoring({ scoring_1st: event.scoring_1st, scoring_2nd: event.scoring_2nd, scoring_3rd: event.scoring_3rd, scoring_4th: event.scoring_4th })
  }, [event, group, me, eventId, navigate])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (umaSum !== 0) {
      setSaveError(`우마 합계가 0이어야 합니다. 현재: ${umaSum}`)
      return
    }
    setSaveError('')
    setSaveSuccess(false)
    try {
      await updateEventMutation.mutateAsync({
        name,
        event_type: eventType,
        ranking_type: rankingType,
        ...uma,
        ...scoring,
      })
      setSaveSuccess(true)
    } catch {
      setSaveError('저장에 실패했습니다.')
    }
  }

  async function handleDelete() {
    setShowDeleteModal(false)
    try {
      await deleteEventMutation.mutateAsync(id!)
      navigate(event?.group_id != null ? `/groups/${event.group_id}` : '/', { replace: true })
    } catch {
      // error toast handled by mutation hook
    }
  }

  async function handleClose() {
    setShowCloseModal(false)
    try {
      await closeEventMutation.mutateAsync(id!)
      navigate(`/events/${eventId}`, { replace: true })
    } catch {
      // error toast handled by mutation hook
    }
  }

  const isClosed = event?.is_closed ?? false
  const canDelete = !!event

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          className="text-sm bg-transparent border-none cursor-pointer p-0"
        >
          ← Back
        </button>
        <h2 className="m-0 ml-4">이벤트 관리</h2>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="text-red-600">Failed to load event</p>
      ) : myRole ? (
        <>
          {isClosed && (
            <div className="bg-gray-100 text-gray-600 text-sm px-4 py-3 rounded-md mb-6">
              이 이벤트는 마감되었습니다. 수정할 수 없습니다.
            </div>
          )}
          <fieldset disabled={isClosed} className="border-none p-0 m-0">
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="block font-bold mb-1.5 text-sm">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaveSuccess(false) }}
                required
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
              />
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-sm">이벤트 타입</label>
              <select
                value={eventType}
                onChange={(e) => { setEventType(e.target.value as EventType); setSaveSuccess(false) }}
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
              >
                <option value="regular">일반 이벤트 (regular)</option>
                <option value="independent">독립 이벤트 (independent)</option>
              </select>
              <p className="mt-1.5 mb-0 text-xs text-gray-500">
                {eventType === 'regular'
                  ? '기록이 그룹 랭킹에 합산됩니다.'
                  : '기록이 그룹 랭킹에 합산되지 않습니다. (연습전, 이벤트전 등)'}
              </p>
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-sm">랭킹 방식</label>
              <select
                value={rankingType}
                onChange={(e) => { setRankingType(e.target.value as RankingType); setSaveSuccess(false) }}
                className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
              >
                <option value="score">점수 합산 (score)</option>
                <option value="match_point">승점 (match_point)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1.5 text-sm">
                우마{' '}
                <span className={`font-normal text-[13px] ${umaSum === 0 ? 'text-green-700' : 'text-red-600'}`}>
                  (합계: {umaSum > 0 ? '+' : ''}{umaSum})
                </span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['uma_1st', 'uma_2nd', 'uma_3rd', 'uma_4th'] as const).map((key, idx) => (
                  <div key={key}>
                    <div className="text-xs text-gray-500 mb-1 text-center">{idx + 1}위</div>
                    <input
                      type="number"
                      value={uma[key]}
                      onChange={(e) => { setUma((prev) => ({ ...prev, [key]: Number(e.target.value) })); setSaveSuccess(false) }}
                      className="border border-gray-300 rounded px-1.5 py-1.5 w-full text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            {rankingType === 'match_point' && (
              <div>
                <label className="block font-bold mb-1.5 text-sm">승점 배점</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['scoring_1st', 'scoring_2nd', 'scoring_3rd', 'scoring_4th'] as const).map((key, idx) => (
                    <div key={key}>
                      <div className="text-xs text-gray-500 mb-1 text-center">{idx + 1}위</div>
                      <input
                        type="number"
                        value={scoring[key]}
                        onChange={(e) => { setScoring((prev) => ({ ...prev, [key]: Number(e.target.value) })); setSaveSuccess(false) }}
                        className="border border-gray-300 rounded px-1.5 py-1.5 w-full text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {saveError && <p className="text-red-600 m-0 text-sm">{saveError}</p>}
            {saveSuccess && <p className="text-green-700 m-0 text-sm">저장되었습니다.</p>}

            <button
              type="submit"
              disabled={updateEventMutation.isPending}
              className="px-5 py-2 text-sm cursor-pointer self-start"
            >
              {updateEventMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </form>
          </fieldset>

          {(canDelete || !isClosed) && (
            <>
              <hr className="my-10 border-gray-100" />

              <div>
                <h3 className="mt-0 mb-3 text-base text-red-600">위험 구역</h3>
                <div className="flex gap-3">
                  {!isClosed && (
                    <button
                      onClick={() => setShowCloseModal(true)}
                      disabled={closeEventMutation.isPending}
                      className="px-5 py-2 text-sm cursor-pointer text-red-600 border border-red-600 rounded bg-transparent"
                    >
                      {closeEventMutation.isPending ? '마감 중...' : '이벤트 마감'}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={deleteEventMutation.isPending}
                      className="px-5 py-2 text-sm cursor-pointer text-red-600 border border-red-600 rounded bg-transparent"
                    >
                      {deleteEventMutation.isPending ? '삭제 중...' : '이벤트 삭제'}
                    </button>
                  )}
                </div>
                <ConfirmModal
                  open={showCloseModal}
                  title="이벤트 마감"
                  description="이 이벤트를 마감하시겠습니까? 마감 후에는 수정할 수 없습니다."
                  confirmLabel="마감"
                  onConfirm={handleClose}
                  onCancel={() => setShowCloseModal(false)}
                  destructive
                />
                <ConfirmModal
                  open={showDeleteModal}
                  title="이벤트 삭제"
                  description="이 이벤트를 삭제하시겠습니까?"
                  confirmLabel="삭제"
                  onConfirm={handleDelete}
                  onCancel={() => setShowDeleteModal(false)}
                  destructive
                />
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
