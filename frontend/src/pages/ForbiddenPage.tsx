import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">403</h1>
      <p className="text-gray-600 mb-6">접근 권한이 없습니다.</p>
      <Link to="/" className="text-blue-600 text-sm">홈으로 이동</Link>
    </div>
  )
}
