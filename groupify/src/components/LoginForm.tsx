'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/features/userSlice';

interface LoginFormProps {
  setShowLogin: (show: boolean) => void;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  username: string;
  password: string;
}

export default function LoginForm({
  setShowLogin,
  username,
  setUsername,
  setPassword,
  password,
}: LoginFormProps) {
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'login', username, password }),
      });

      const data = await response.json();

      if (data.success) {
        dispatch(setUser(data.user));
        if (data.needsSpotifyAuth) {
          window.location.href = '/authorise'; // <-- Redirect to Spotify OAuth
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <div className='login-container flex flex-col items-center'>
      <h2 className='mb-6 text-center text-2xl font-bold'>Login</h2>
      {error && (
        <div className='mb-4 rounded bg-red-100 p-3 text-red-700'>{error}</div>
      )}
      <form
        onSubmit={handleSubmit}
        className='login-form flex flex-col items-center'
      >
        <div>
          <label
            htmlFor='username'
            className='text-white-700 block text-sm font-medium'
          >
            Username
          </label>
          <input
            type='text'
            id='username'
            value={username}
            onChange={e => setUsername(e.target.value)}
            className='mb-4 w-80 rounded-md border-2 border-gray-300 p-2'
            required
          />
        </div>
        <div>
          <label
            htmlFor='password'
            className='text-white-700 block text-sm font-medium'
          >
            Password
          </label>
          <input
            type='password'
            id='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            className='mb-4 w-80 rounded-md border-2 border-gray-300 p-2'
          />
        </div>
        <button
          type='submit'
          className='rounded-md bg-[#fd4343] px-4 py-2 text-white hover:bg-[#FF6B6B]'
        >
          Login
        </button>
      </form>
      <div className='mt-4 text-center'>
        <button
          onClick={() => setShowLogin(false)}
          className='mb-4 cursor-pointer text-center text-gray-500 hover:text-[#7B61FF]'
        >
          Don't have an account? Sign up
        </button>
      </div>
    </div>
  );
}
