'use client';

import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
import { resetAll } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { RainbowButton } from '@/components/RainbowButton';

interface Playlist {
  id: string;
  name: string;
}

export default function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();
  const [showLogin, setShowLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // 1. Check authentication
        const authResponse = await fetch('/api/auth/check', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        const authData = await authResponse.json();

        if (!authResponse.ok || !authData.authenticated) {
          setIsAuthenticated(false);
          setShowLogin(true);
        } else {
          setIsAuthenticated(true);
          console.log('User authenticated:', authData.user);

          // 2. Fetch playlists if authenticated
          const playlistsResponse = await fetch('/api/playlists', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (playlistsResponse.ok) {
            const playlistsData = await playlistsResponse.json();
            console.log('Fetched playlists:', playlistsData);
            setPlaylists(playlistsData);
          } else {
            console.warn('Failed to fetch playlists');
            setPlaylists([]);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        setShowLogin(true);
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, []);

  const handleJoinPlaylist = (playlistId: string) => {
    if (!playlistId) {
      console.error('Playlist ID is undefined or null');
      return;
    }
    router.push(`/join-party?playlistId=${playlistId}`);
  };

  const handleReset = async () => {
    try {
      console.log('Starting complete reset...');

      // Clear all browser storage first
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();

        // Clear all cookies
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
      }

      // Reset database
      const response = await fetch('/api/dev-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = await response.json();
      console.log('Reset response:', responseData);

      if (!response.ok) {
        throw new Error(
          responseData.details || responseData.error || 'Failed to reset database'
        );
      }

      // Clear Redux store
      dispatch(resetAll());

      // Clear component state immediately
      setPlaylists([]);
      setIsAuthenticated(false);
      setShowLogin(true);

      console.log('Reset successful, reloading page...');

      // Force hard reload to clear all cached state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      console.error('Error resetting:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reset. Please try again.';
      setError(errorMessage);

      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  if (isLoading) {
    return (
      <div className='landing-container flex h-screen flex-col items-center justify-center'>
        <h1 className='logo mb-4 text-9xl font-bold'>Groupify</h1>
        <h2 className='mb-6 text-center text-3xl font-bold'>Loading...</h2>
      </div>
    );
  }

  return (
    <div className='landing-container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
      <h1 className='logo mb-4 text-9xl font-bold'>Groupify</h1>

      {!isAuthenticated ? (
        <div className='w-full max-w-md'>
          {showLogin ? (
            <LoginForm
              setShowLogin={setShowLogin}
              username={username}
              setUsername={setUsername}
              setPassword={setPassword}
              password={password}
            />
          ) : (
            <SignupForm
              setShowLogin={setShowLogin}
              username={username}
              setUsername={setUsername}
              setPassword={setPassword}
              password={password}
            />
          )}
        </div>
      ) : (
        <div className='mt-12 w-full max-w-md'>
          <div className='playlists-container mb-6 flex flex-col items-center'>
            {playlists.length > 0 ? (
              playlists.map(playlist => (
                <div
                  key={playlist.id}
                  className='playlist-item mb-4 flex w-full items-center justify-between rounded-md border-2 border-gray-300 p-4'
                >
                  <span className='text-lg font-medium'>{playlist.name}</span>
                  <button
                    className='rounded-md bg-[#FF6B6B] px-4 py-2 text-white transition-colors hover:bg-[#fd4343]'
                    onClick={() => handleJoinPlaylist(playlist.id)}
                  >
                    Join
                  </button>
                </div>
              ))
            ) : (
              <div className='text-center text-gray-500'>
                No playlists available. Create one to get started!
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className='error mb-4 text-center text-red-500'>{error}</p>}

      {process.env.NODE_ENV === 'development' && (
        <button
          className='rounded-md bg-red-500 px-6 py-3 text-white hover:bg-red-600'
          onClick={handleReset}
        >
          Reset Store & Database
        </button>
      )}

      {isAuthenticated && (
        <RainbowButton
          text='Start a party!'
          href='/generate-party'
          className='mt-4'
        />
      )}
    </div>
  );
}
