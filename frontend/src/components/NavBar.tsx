import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore, getResolvedTheme } from '../stores/themeStore'

export default function NavBar() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const clearTokens = useAuthStore((s) => s.clearTokens)
  const navigate = useNavigate()

  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  function cycleTheme() {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  const resolved = getResolvedTheme(theme)
  const icon = theme === 'system' ? '🖥️' : resolved === 'dark' ? '🌙' : '☀️'

  function handleLogout() {
    clearTokens()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link to="/" className="font-bold text-base no-underline text-inherit">
          마작 모임
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={cycleTheme}
            className="text-sm px-1.5 py-1 cursor-pointer bg-transparent border-none"
            title={`테마: ${theme === 'system' ? '시스템' : theme === 'dark' ? '다크' : '라이트'}`}
          >
            {icon}
          </button>
          <Link to="/help" className="text-sm no-underline text-gray-600 dark:text-gray-400">
            도움말
          </Link>
          {accessToken ? (
            <>
              <Link to="/mypage" className="text-sm no-underline text-gray-600 dark:text-gray-400">
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm px-2.5 py-1 cursor-pointer bg-transparent border border-gray-300 dark:border-gray-600 rounded dark:text-gray-300"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm no-underline text-blue-600 dark:text-blue-400">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
