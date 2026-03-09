import { useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { usePublicGroups } from '../hooks/usePublicGroups'
import { useMyGroups } from '../hooks/useMyGroups'
import { useJoinGroup } from '../hooks/mutations/useJoinGroup'
import { useAuthStore } from '../stores/authStore'
import AnnouncementSection from '../components/AnnouncementSection'

const PAGE_SIZE = 10

export default function MainPage() {
  const [page, setPage] = useState(1)
  const accessToken = useAuthStore((s) => s.accessToken)
  const { data, isLoading, isError } = usePublicGroups(page)
  const { data: myGroups } = useMyGroups()
  const joinGroupMutation = useJoinGroup()

  const myGroupIds = new Set(myGroups?.map((g) => g.id) ?? [])

  const groups = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="mt-0 mb-6 text-xl font-bold">공개 모임</h1>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="text-red-600 dark:text-red-400">모임 목록을 불러올 수 없습니다.</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500">아직 공개 모임이 없습니다.</p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {groups.map((g) => {
            const isJoined = myGroupIds.has(g.id)
            return (
              <li key={g.id} className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                <Link
                  to={`/groups/${g.id}`}
                  className="flex-1 p-[14px] no-underline text-inherit"
                >
                  <div className="font-bold text-[15px]">{g.name}</div>
                  {g.description && (
                    <div className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{g.description}</div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {new Date(g.created_at).toLocaleDateString()}
                  </div>
                </Link>
                {accessToken && (
                  <div className="pr-3 shrink-0">
                    {isJoined ? (
                      <span className="text-xs text-gray-400 dark:text-gray-500 px-2 py-1">가입됨</span>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); joinGroupMutation.mutate({ groupId: g.id }) }}
                        disabled={joinGroupMutation.isPending}
                        className="text-xs px-3 py-1.5 cursor-pointer rounded border border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent"
                      >
                        가입
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {!isLoading && total > 0 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 cursor-pointer"
          >
            Prev
          </button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      <AnnouncementSection />
    </div>
  )
}
