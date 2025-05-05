'use client';

import { Song } from '../interfaces/Song';
import { Vote } from '../interfaces/Vote';
import SearchBar from './SearchBar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeavePartyButton } from './LeavePartyButton';
import { useDispatch } from 'react-redux';
import { clearUser } from '@/lib/features/userSlice';

interface DashboardProps {
  PlayedJson: Song[];
  HotJson: Song[];
  HotVotes: Vote[];
  UserID: string;
  PartyCode: string;
}

export default function DashboardPage({
  PlayedJson,
  HotJson,
  HotVotes,
  UserID,
  PartyCode,
}: DashboardProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const router = useRouter();
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchPlaylists = async () => {
      try{
        const response = await fetch('/api/playlists');
        if(!response.ok){
          throw new Error('Failed to fetch playlists');
        }
        const data = await response.json();
        console.log('Fetched playlists:', data); //Debugging
        setPlaylists(data);
      } catch (err) {
        console.error('Error fetching playlists:', err);
      } 
    };

    fetchPlaylists();
  }, []);

  useEffect(() => {
    const checkAuthentication = async () => {
      const response = await fetch('/api/auth/check'); // Endpoint to check authentication
      if (!response.ok) {
        router.push('/login'); // Redirect to login if not authenticated
      }
    };

    checkAuthentication();
  }, [router]);

  const handleUpvote = (spotifyId: string) => {
    fetch('api/upvote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserID, SpotifyID: spotifyId }),
    });
  };

  const handleDownvote = (spotifyId: string) => {
    fetch('api/downvote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserID, SpotifyID: spotifyId }),
    });
  };

  const handleSongSelect = (song: Song) => {
    fetch('/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: song.name }),
    });
  };

  const handleJoinPlaylist = (playlistId: string) => {
    window.location.href = `/dashboard?playlistId=${playlistId}`;
  };

  const handleGeneratePlaylist = async () => {
    try {
      const authResponse = await fetch('/api/auth/check');
      if (!authResponse.ok) {
        router.push('/login'); // Redirect to login if not authenticated
        return;
      }

      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Playlist', isPublic: true }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        console.error('Error generating playlist:', error);
        return;
      }

      const newPlaylist = await response.json();
      setPlaylists((prev: any) => [newPlaylist, ...prev]);
    } catch (err) {
      console.error('Error generating playlist:', err);
    }
  };

  const HotSongs = HotVotes.sort((a, b) => b.Votes - a.Votes).map((vote) => {
    const song = HotJson.find((song) => song.id === vote.SongID);
    return Object.assign({}, vote, song);
  });

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    dispatch(clearUser());
    window.location.href = '/login'; // Redirect to login page
  };

  return (
    <div className="dashboard-container bg-white dark:bg-gray-900">
      <nav className="navbar">
        <div className="navbar-left mb-auto">
          <h1 className="logo text-4xl">Groupify</h1>
        </div>
        <div className="navbar-center">
          <SearchBar onSelect={handleSongSelect} />
        </div>
        <div className="navbar-right flex flex-col items-center justify-center">
          <button
            className="ml-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
          <LeavePartyButton PartyCode={PartyCode} />
        </div>
      </nav>

      <div className="dashboard-content">
      <div className='party-code-container'>
        <h2 className="text-white text-xl justify-items-center">
          Party Code: <b className="font-bold text-[#FF6B6B] text-2xl">{PartyCode}</b>
        </h2>
      </div>
        <div className="playlist-section">
          <h2 className="section-title">Playlists</h2>
          <div className="playlist-container">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="playlist-item mb-4 p-4 rounded-md w-80 border-2 border-gray-300 flex justify-between items-center"
              >
                <span className="text-lg font-medium">{playlist.name}</span>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={() => handleJoinPlaylist(playlist.PlaylistID)}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="playlist-section">
          <h2 className="section-title">Now Playing</h2>
          <div className="playlist-container">
            {PlayedJson.map((song, index) => (
              <div key={song.id} className={`song-card ${index === 0 ? 'active' : ''}`}>
                <a href={song.external_urls.spotify} className="song-link">
                  <div className="song-info">
                    <span className="song-name">{song.name}</span>
                    <span className="artist-name">{song.artists[0].name}</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="hot-section">
          <h2 className="section-title">Hot Tracks</h2>
          <div className="playlist-container">
            {HotSongs.filter((song) => song.id !== null).map((song, index) => (
              <div key={song.id} className="song-card">
                <div className="vote-controls">
                  <button
                    className={`vote-button upvote ${song.Selected === 'up' ? 'selected' : ''}`}
                    onClick={() => handleUpvote(song.id)}
                  >
                    <svg
                      className="w-6 h-6 text-gray-800 dark:text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m5 15 7-7 7 7"
                      />
                    </svg>
                  </button>
                  <div className="vote-count">{song.Votes || 1}</div>
                  <button
                    className={`vote-button downvote ${song.Selected === 'down' ? 'selected' : ''}`}
                    onClick={() => handleDownvote(song.id)}
                  >
                    <svg
                      className="w-6 h-6 text-gray-800 dark:text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m19 9-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
                <a href={song.external_urls.spotify} className="song-link">
                  <div className="song-info">
                    <img src={song.image} alt={song.name} className="song-image object-top-right" />
                    <span className="song-name">{song.name}</span>
                    <span className="artist-name">{song.artists[0].name}</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}