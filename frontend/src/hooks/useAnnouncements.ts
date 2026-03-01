import { useQuery } from '@tanstack/react-query'
import { getAnnouncements } from '../api/announcements'

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => getAnnouncements(),
  })
}
