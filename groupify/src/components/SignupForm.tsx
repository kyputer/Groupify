'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setUser } from '@/lib/features/userSlice'

interface SignupFormProps {
  setShowLogin: (show: boolean) => void
  setUsername: (username: string) => void
  username: string
  setPassword: (password: string) => void
  password: string
}

export default function SignupForm({ setShowLogin, setUsername, username, setPassword, password }: SignupFormProps) {
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
        body: JSON.stringify({ type: 'register', username, password })
      })

      const data = await response.json()

      if (data.success) {
        dispatch(setUser(data.user))
        router.push('/api/authorise')
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      setError('An error occurred during signup')
    }
  }

  return (
    <div className="login-container flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
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
            required
          />
        </div>
        <button
          type="submit"
          className="bg-[#fd4343] text-white px-4 py-2 rounded-md hover:bg-[#FF6B6B]"
        >
          Sign Up
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowLogin(true)}
          className="text-gray-500 text-center mb-4 cursor-pointer hover:text-[#7B61FF]"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  )
} 