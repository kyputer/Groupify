'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/features/userSlice';

interface SignupFormProps {
  setShowLogin: (show: boolean) => void;
  setUsername: (username: string) => void;
  username: string;
  setPassword: (password: string) => void;
  password: string;
}

export default function SignupForm({
  setShowLogin,
  setUsername,
  username,
  setPassword,
  password,
}: SignupFormProps) {
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
        body: JSON.stringify({ type: 'register', username, password }),
      });

      const data = await response.json();

      if (data.success) {
        dispatch(setUser(data.user));
        router.push('/api/authorise');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('An error occurred during signup');
    }
  };

  return (
    <div className='login-container flex flex-col items-center'>
      <h2 className='mb-6 text-center text-2xl font-bold'>Sign Up</h2>
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
            required
          />
        </div>
        <button
          type='submit'
          className='rounded-md bg-[#fd4343] px-4 py-2 text-white hover:bg-[#FF6B6B]'
        >
          Sign Up
        </button>
      </form>
      <div className='mt-4 text-center'>
        <button
          onClick={() => setShowLogin(true)}
          className='mb-4 cursor-pointer text-center text-gray-500 hover:text-[#7B61FF]'
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}
