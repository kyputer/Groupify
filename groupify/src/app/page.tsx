'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [playlists, setPlaylists] = useState([
    { id: '1', name: 'Party Playlist 1' },
    { id: '2', name: 'Chill Vibes' },
    { id: '3', name: 'Workout Mix' },
  ]);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoinPlaylist = (playlistId: string) => {
    router.push(`/join-party?playlistId=${playlistId}`);
  };

  const handleGeneratePlaylist = async () => {
    try {
      const response = await fetch('/api/generate-party-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError(error);
        return;
      }

      const { code } = await response.json();
      router.push(`/dashboard?partyCode=${code}`);
    } catch (err) {
      console.error('Error generating playlist code:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="landing-container flex flex-col items-center justify-center h-screen">
      <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
      <h2 className="text-3xl font-bold mb-6 text-center">Join the party!</h2>
      {error && <p className="error text-red-500 text-center mb-4">{error}</p>}
      <div className="playlists-container flex flex-col items-center mb-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="playlist-item mb-4 p-4 rounded-md w-80 border-2 border-gray-300 flex justify-between items-center"
          >
            <span className="text-lg font-medium">{playlist.name}</span>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              onClick={() => handleJoinPlaylist(playlist.id)}
            >
              Join
            </button>
          </div>
        ))}
      </div>
      <button
        className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600"
        onClick={handleGeneratePlaylist}
      >
        Generate New Playlist
      </button>
    </div>
  );
}
