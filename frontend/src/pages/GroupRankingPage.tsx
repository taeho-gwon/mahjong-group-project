import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useEvents } from '../hooks/useEvents'

export default function GroupRankingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: events, isError } = useEvents(id ? Number(id) : undefined)

  useEffect(() => {
    if (!events) return
    const defaultAggregate = events.find((c) => c.event_type === 'aggregate' && c.is_default)
    if (!defaultAggregate) return
    navigate(`/events/${defaultAggregate.id}`, { replace: true })
  }, [events, navigate])

  if (isError) return <p className="p-6 text-red-600">Failed to load events</p>
  if (events && !events.find((c) => c.event_type === 'aggregate' && c.is_default)) {
    return <p className="p-6 text-red-600">전체 랭킹을 찾을 수 없습니다.</p>
  }
  return <Spinner />
}
