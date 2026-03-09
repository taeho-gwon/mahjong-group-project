import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useUserProfile } from '../hooks/useUserProfile'
import { useMe } from '../hooks/useMe'
import { ApiError } from '../api/errors'

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const id = userId ? Number(userId) : undefined

  const { data: me } = useMe()
  const { data: profile, isLoading, isError, error } = useUserProfile(id)

  if (me && id === me.id) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          본인 프로필입니다.{' '}
          <Link to="/mypage" className="text-blue-600 dark:text-blue-400">마이페이지로 이동</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm bg-transparent border-none cursor-pointer p-0"
      >
        ← Back
      </button>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        error instanceof ApiError && error.isNotFound ? (
          <Navigate to="/not-found" replace />
        ) : (
          <p className="mt-6 text-red-600 dark:text-red-400">유저 정보를 불러올 수 없습니다.</p>
        )
      ) : profile ? (
        <>
          <section className="mt-6 mb-8">
            <h2 className="mt-0 mb-2">{profile.username}</h2>
            {profile.nickname && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">닉네임: {profile.nickname}</div>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              가입일: {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </section>

          <section>
            <h3 className="mt-0 mb-3">공통 소속 모임</h3>
            {profile.shared_groups.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 m-0">공통 모임이 없습니다.</p>
            ) : (
              <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
                {profile.shared_groups.map((g) => (
                  <li key={g.id}>
                    <Link
                      to={`/groups/${g.id}`}
                      className="block border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2.5 text-sm no-underline text-inherit"
                    >
                      {g.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
