'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, setUser } from '@/lib/features/userSlice';
import { RootState } from '@/lib/store';
import { Link } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'register', username, password }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError(error);
        return;
      }

      const { user } = await response.json();
      dispatch(setUser(user));
      router.push('/api/authorise'); // Redirect to Spotify authorization
    } catch (err) {
      console.error('Signup error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="signup-container flex flex-col items-center justify-center h-screen">
      <form onSubmit={handleSignup} className="signup-form flex flex-col items-center justify-center">
       
        <h1 className="text-3xl font-bold mb-4 pt-6 text-center">Sign Up</h1>
        <p className="text-gray-500 text-center mb-4 cursor-pointer hover:text-[#7B61FF]" onClick={() => router.push('/login')} >Already have an account? </p>
        {error && <p className="error text-red-500 text-center mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          className="mb-4 p-2 rounded-md w-80 border-2 border-gray-300"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-4 p-2 rounded-md w-80 border-2 border-gray-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-[#fd4343] text-white px-4 py-2 rounded-md hover:bg-[#FF6B6B]">Sign Up</button>
      </form>
    </div>
  );
}
