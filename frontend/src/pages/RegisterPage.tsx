import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import AnnouncementSection from '../components/AnnouncementSection'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(username, password)
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-[300px]">
        <h2 className="mb-2 text-xl font-bold">Register</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          maxLength={50}
          className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
        />
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={100}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full"
          />
          <p className="mt-1 mb-0 text-xs text-gray-400">8자 이상</p>
        </div>
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          maxLength={100}
          className="border border-gray-300 rounded-md px-4 py-2.5 text-sm"
        />
        {error && <p className="text-red-600 m-0 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="px-4 py-2.5 text-sm cursor-pointer">
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p className="m-0 text-center text-sm">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
      <div className="w-[300px]">
        <AnnouncementSection />
      </div>
    </div>
  )
}
