import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="text-blue-600 dark:text-blue-400 text-sm">홈으로 이동</Link>
    </div>
  )
}
