import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { joinByInvite } from '../api/groups'

export default function JoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link')
      return
    }

    joinByInvite(token)
      .then((group) => {
        navigate(`/groups/${group.id}`, { replace: true })
      })
      .catch(async (res) => {
        if (res instanceof Response && res.status === 401) {
          navigate('/login', { replace: true })
        } else {
          let message = 'Failed to join group'
          try {
            const body = await res.json()
            if (body?.detail) message = body.detail
          } catch {
            // ignore
          }
          setError(message)
        }
      })
  }, [token, navigate])

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <Link to="/">Go to main</Link>
      </div>
    )
  }

  return <p>Joining...</p>
}
