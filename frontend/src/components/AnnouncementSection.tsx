import { useAnnouncements } from '../hooks/useAnnouncements'

export default function AnnouncementSection() {
  const { data: announcements } = useAnnouncements()

  if (!announcements || announcements.length === 0) return null

  return (
    <section className="mt-8 border-t border-gray-200 pt-6">
      <h2 className="text-base font-bold mb-3">안내</h2>
      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {announcements.map((a) => (
          <li key={a.id} className="border border-gray-200 rounded-md p-3">
            <div className="font-bold text-sm">{a.title}</div>
            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{a.content}</div>
            <div className="text-xs text-gray-400 mt-2">
              {new Date(a.created_at).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
