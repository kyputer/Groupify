'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setUser } from '@/lib/features/userSlice'

interface LoginFormProps {
  setShowLogin: (show: boolean) => void
  setUsername: (username: string) => void
  setPassword: (password: string) => void
  username: string
  password: string
}

export default function LoginForm({ setShowLogin, username, setUsername, setPassword, password }: LoginFormProps) {
  const [error, setError] = useState('')
  const router = useRouter()
  const dispatch = useDispatch()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'login', username, password })
      })

      const data = await response.json()

      if (data.success) {
        dispatch(setUser(data.user))
        router.push('/')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred during login')
    }
  }

  return (
    <div className="login-container flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="login-form flex flex-col items-center">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4 p-2 rounded-md w-80 border-2 border-gray-300"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 p-2 rounded-md w-80 border-2 border-gray-300"
          />
        </div>
        <button
          type="submit"
          className="bg-[#fd4343] text-white px-4 py-2 rounded-md hover:bg-[#FF6B6B]"
        >
          Login
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowLogin(false)}
          className="text-gray-500 text-center mb-4 cursor-pointer hover:text-[#7B61FF]"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  )
} 