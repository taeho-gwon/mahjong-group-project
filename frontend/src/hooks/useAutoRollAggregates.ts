import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { EventResponse } from '../api/events'
import { closeEvent, createEvent } from '../api/events'

function computeNextPeriod(periodEnd: string, presetType: string): { start: string; end: string } {
  const base = new Date(periodEnd)
  const start = new Date(base)
  const end = new Date(base)

  switch (presetType) {
    case 'daily':
      end.setDate(end.getDate() + 1)
      break
    case 'weekly':
      end.setDate(end.getDate() + 7)
      break
    case 'monthly':
      end.setMonth(end.getMonth() + 1)
      break
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1)
      break
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export function useAutoRollAggregates(events: EventResponse[], groupId: number | undefined) {
  const queryClient = useQueryClient()
  const processedRef = useRef(new Set<number>())

  useEffect(() => {
    if (!groupId || events.length === 0) return

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const expired = events.filter(
      (e) =>
        e.event_type === 'aggregate' &&
        !e.is_closed &&
        e.period_end &&
        e.preset_type &&
        e.preset_type !== 'all' &&
        e.preset_type !== 'custom' &&
        new Date(e.period_end) < now &&
        !processedRef.current.has(e.id),
    )

    if (expired.length === 0) return

    async function rollAll() {
      for (const evt of expired) {
        processedRef.current.add(evt.id)
        try {
          await closeEvent(evt.id)
          const next = computeNextPeriod(evt.period_end!, evt.preset_type!)
          await createEvent({
            name: evt.name,
            event_type: 'aggregate',
            group_id: groupId ?? null,
            ranking_type: evt.ranking_type,
            uma_1st: evt.uma_1st,
            uma_2nd: evt.uma_2nd,
            uma_3rd: evt.uma_3rd,
            uma_4th: evt.uma_4th,
            scoring_1st: evt.scoring_1st,
            scoring_2nd: evt.scoring_2nd,
            scoring_3rd: evt.scoring_3rd,
            scoring_4th: evt.scoring_4th,
            period_start: next.start,
            period_end: next.end,
            preset_type: evt.preset_type,
          })
        } catch {
          // 실패 시 무시 — 다음 방문 시 재시도
        }
      }
      queryClient.invalidateQueries({ queryKey: ['events', groupId] })
    }

    rollAll()
  }, [events, groupId, queryClient])
}
