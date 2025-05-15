'use client';

import { Song } from '../interfaces/Song';
import { Vote } from '../interfaces/Vote';
import SearchBar from './SearchBar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeavePartyButton } from './LeavePartyButton';
import { LogOutButton } from './LogOutButton';
import SongCard from './SongCard';


interface DashboardProps {
  PlayedJson: Song[];
  HotJson: Song[];
  HotVotes: Vote[];
  UserID: string;
  PartyCode: string;
  PlaylistID: string;
}

export default function DashboardPage({
  PlayedJson,
  HotJson,
  HotVotes,
  UserID,
  PartyCode,
  PlaylistID
}: DashboardProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [hotTracks, setHotTracks] = useState<Song[]>(HotJson);
  const [hotVotes, setHotVotes] = useState<Vote[]>(HotVotes);
  const [playedTracks, setPlayedTracks] = useState<Song[]>(PlayedJson);
  const router = useRouter();

  const refreshHotTracks = async () => {
    try {
      const encodedCode = encodeURIComponent(PartyCode);
      const response = await fetch(`/api/dashboard/${encodedCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      console.log('Refreshed dashboard data:', data);
      setHotTracks(data.HotJson);
      setHotVotes(data.HotVotes);
      setPlayedTracks(data.PlayedJson);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!response.ok || !data.authenticated) {
          console.log('Not authenticated, redirecting to login');
          router.push('/login');
          return;
        }
        
        console.log('User authenticated:', data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuthentication();
  }, [router]);

  useEffect(() => {
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
        console.error('Error fetching playlists:', err);
      }
    };

    fetchPlaylists();
  }, []);

  const handleVote = async (track: Song, voteType: 'upvote' | 'downvote') => {
    try {
      console.log('Handling vote:', { track, voteType, userID: UserID, playlistID: PlaylistID });
      
      const response = await fetch(`/api/${voteType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserID,
          SpotifyID: track.id,
          Code: PartyCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Vote error response:', errorData);
        throw new Error(errorData.error || `Failed to ${voteType}`);
      }

      const result = await response.json();
      console.log('Vote result:', result);
      
      // Update the local state with the new vote count
      setHotTracks(prevTracks => 
        prevTracks.map(t => 
          t.id === track.id 
            ? { ...t, Votes: result.votes }
            : t
        )
      );

      // Update the votes state
      setHotVotes(prevVotes => {
        const existingVote = prevVotes.find(v => v.SpotifyID === track.id);
        if (result.voteType === 'neutral') {
          // Remove the vote if it's neutral
          return prevVotes.filter(v => v.SpotifyID !== track.id);
        } else if (existingVote) {
          // Update existing vote
          return prevVotes.map(v => 
            v.SpotifyID === track.id 
              ? { 
                  ...v, 
                  Votes: result.votes, 
                  Selected: result.voteType, 
                  SpotifyID: track.id 
                }
              : v
          );
        } else {
          // Add new vote
          return [...prevVotes, { 
            SongID: track.id, 
            SpotifyID: track.id,
            Votes: result.votes, 
            Selected: result.voteType 
          }];
        }
      });

      // Refresh hot tracks to ensure we have the latest data
      await refreshHotTracks();
    } catch (error) {
      console.error(`Error ${voteType}ing track:`, error);
      alert(`Failed to ${voteType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleJoinPlaylist = async (playlistId: string) => {
    const success = await fetch(`/api/join-party/${playlistId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Include cookies in the request
    });
    if (success.ok) {
      const data = await success.json();
      console.log('Joined playlist:', data);
      refreshHotTracks();
    }
  };

  return (
    <div className="dashboard-container bg-white dark:bg-gray-900">
      <nav className="navbar">
        <div className="navbar-left mb-auto">
          <h1 className="logo text-4xl">Groupify</h1>
        </div>
        <div className="navbar-center">
          <SearchBar 
            UserID={UserID} 
            playlistID={PlaylistID} 
            onTrackAdded={refreshHotTracks}
          />
        </div>
        <div className="navbar-right flex flex-col items-center justify-center">
          <LogOutButton/>
        </div>
      </nav>

      <div className="dashboard-content">
        {PartyCode && (
        <div className='party-code-container flex items-center gap-4 mb-8'>
          <h2 className="text-white text-xl">
            Party Code: <span className="text-[#FF6B6B] font-bold">{PartyCode}</span>
          </h2>
          <LeavePartyButton PartyCode={PartyCode} UserID={UserID} />
        </div>
        )}
        <div className="playlist-section">
          <h2 className="section-title">Playlists</h2>
          <div className="playlist-container">
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="playlist-item mr-2 mb-4 p-4 rounded-md w-80 border-2 border-gray-300 flex justify-between items-center"
                >
                  <span className="text-lg font-medium">{playlist.name}</span>
                  
                  {playlist.code === PartyCode ? (
                    <button
                      className="bg-[#7B61FF] text-white px-4 py-2 rounded-md cursor-default"
                      disabled
                    >
                      Joined
                    </button>
                  ):( 
                    <button
                      className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                      onClick={() => handleJoinPlaylist(playlist.id)}
                    >
                      Join
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center w-full py-8">
                No playlists available. Create one to get started!
              </div>
            )}
          </div>
        </div>
        <h2 className="section-title">Now Playing</h2>
        <div className="playlist-section overflow-auto">
          
          <div className="playlist-container overflow-y-scroll">
            {playedTracks && playedTracks.length > 0 ? (
              playedTracks.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  showVoting={false}
                />
              ))
            ) : (
              <div className="text-gray-500 text-center w-full py-8">
                No songs are currently playing. Add some songs to get started!
              </div>
            )}
          </div>
        </div>
        <h2 className="section-title">Hot Tracks</h2>
        <div className="playlist-section overflow-auto">
          
          <div className="playlist-container overflow-y-scroll">
            {hotTracks.length > 0 ? (
              hotTracks.map((song) => {
                const vote = hotVotes.find(v => v.SongID === song.id);
                const voteCount = vote?.Votes ?? song.Votes ?? 0;
                
                return (
                  <SongCard
                    key={song.id}
                    song={song}
                    vote={vote}
                    voteCount={voteCount}
                    onVote={handleVote}
                    showVoting={true}
                  />
                );
              })
            ) : (
              <div className="text-gray-500 text-center w-full py-8">
                No hot tracks yet. Add some songs and vote to see them here!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}