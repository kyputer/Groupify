'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/features/userSlice';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'login', username, password }),
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
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="login-container flex flex-col items-center justify-center h-screen">
      <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
      <form onSubmit={handleLogin} className="login-form flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4 pt-6 text-center">Login</h1>
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
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Login</button>
      </form>
    </div>
  );
}
