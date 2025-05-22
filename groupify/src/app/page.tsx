'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { resetAll } from '@/lib/actions';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
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
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!response.ok || !data.authenticated) {
          setIsAuthenticated(false);
          setShowLogin(true);
        } else {
          setIsAuthenticated(true);
          console.log('User authenticated:', data.user);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
        setShowLogin(true);
      }
    };

    const fetchPlaylists = async () => {
      try {
        const response = await fetch('/api/playlists');
        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const data = await response.json();
        console.log('Fetched playlists:', data);
        setPlaylists(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load playlists.');
      }
    };

    checkAuth().then(() => {
      if (!isLoading) {
        fetchPlaylists();
      }
    });
  }, [router, isLoading]);

  const handleJoinPlaylist = (playlistId: string) => {
    if(!playlistId) {
      console.error('Playlist ID is undefined or null');
      return;
    }

    router.push(`/join-party?playlistId=${playlistId}`);
  };

  const handleReset = async () => {
    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset database');
      }

      dispatch(resetAll());
      window.location.reload();
    } catch (err) {
      console.error('Error resetting:', err);
      setError('Failed to reset. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="landing-container flex flex-col items-center justify-center h-screen">
        <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
        <h2 className="text-3xl font-bold mb-6 text-center">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="landing-container flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
      
      {!isAuthenticated ? (
        <div className="w-full max-w-md">
          {showLogin ? (
            <LoginForm setShowLogin={setShowLogin} username={username} setUsername={setUsername} setPassword={setPassword} password={password}/>
          ) : (
            <SignupForm setShowLogin={setShowLogin} username={username} setUsername={setUsername} setPassword={setPassword} password={password}/>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md mt-12">
          <div className="playlists-container flex flex-col items-center mb-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="playlist-item mb-4 p-4 rounded-md w-full border-2 border-gray-300 flex justify-between items-center"
              >
                <span className="text-lg font-medium">{playlist.name}</span>
                <button
                  className="bg-[#FF6B6B] text-white px-4 py-2 rounded-md hover:bg-[#fd4343] transition-colors"
                  onClick={() => handleJoinPlaylist(playlist.id)}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && <p className="error text-red-500 text-center mb-4">{error}</p>}
      
      {process.env.NODE_ENV === 'development' && (
        <button
          className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600"
          onClick={handleReset}
        >
          Reset Store & Database
        </button>
      )}
      {isAuthenticated && (
        <RainbowButton text="Start a party!" href="/generate-party" className="mt-4" />
      )}
    </div>
  );
}