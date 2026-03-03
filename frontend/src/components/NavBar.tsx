import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function NavBar() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const clearTokens = useAuthStore((s) => s.clearTokens)
  const navigate = useNavigate()

  function handleLogout() {
    clearTokens()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link to="/" className="font-bold text-base no-underline text-inherit">
          마작 모임
        </Link>
        <div className="flex items-center gap-3">
          {accessToken ? (
            <>
              <Link to="/mypage" className="text-sm no-underline text-gray-600">
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm px-2.5 py-1 cursor-pointer bg-transparent border border-gray-300 rounded"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm no-underline text-blue-600">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
