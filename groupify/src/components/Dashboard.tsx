'use client';

import { Song } from '../interfaces/Song';
import { Vote } from '../interfaces/Vote';
import SearchBar from './SearchBar';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LeavePartyButton } from './LeavePartyButton';
import { LogOutButton } from './LogOutButton';
import SongCard from './SongCard';
import { Tabs, TabList, Tab, TabPanel } from "react-tabs"
import "react-tabs/style/react-tabs.css"
import { RainbowButton } from './RainbowButton';

interface DashboardProps {
  PlayedJson: Song[];
  HotJson: Song[];
  HotVotes: Vote[];
  UserID: string;
  PartyCode: string;
  PlaylistID: string;
  onPartyJoin?: (partyCode: string, playlistId: string) => void;
}

export default function DashboardPage({
  PlayedJson,
  HotJson,
  HotVotes,
  UserID,
  PartyCode,
  PlaylistID,
  onPartyJoin
}: DashboardProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [hotTracks, setHotTracks] = useState<Song[]>(HotJson);
  const [hotVotes, setHotVotes] = useState<Vote[]>(HotVotes);
  const [playedTracks, setPlayedTracks] = useState<Song[]>(PlayedJson);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const authChecked = useRef(false);
  const router = useRouter();

  const checkAuthentication = useCallback(async () => {
    if (authChecked.current) return;
    
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (!response.ok || !data.authenticated) {
        router.push('/login');
        return;
      }
      setIsAuthenticated(true);
      authChecked.current = true;
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchPlaylists = useCallback(async () => {
    try {
      const response = await fetch('/api/playlists', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      const data = await response.json();
      // Sort playlists: joined ones first, then by creation date
      const sortedPlaylists = data.sort((a: any, b: any) => {
        // First sort by joined status
        if (a.code === PartyCode && b.code !== PartyCode) return -1;
        if (a.code !== PartyCode && b.code === PartyCode) return 1;
        if (a.isJoined && !b.isJoined) return -1;
        if (!a.isJoined && b.isJoined) return 1;
        // Then sort by creation date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPlaylists(sortedPlaylists);
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  }, [PartyCode]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    }
  }, [isAuthenticated, fetchPlaylists]);

  const refreshHotTracks = async () => {
    try {
      const encodedCode = encodeURIComponent(PartyCode);
      const response = await fetch(`/api/dashboard/${encodedCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      
      // Update all states to trigger re-render
      setHotTracks(data.HotJson);
      setHotVotes(data.HotVotes);
      setPlayedTracks(data.PlayedJson);
      
      // Force a re-render by updating a state
      setPlaylists(prevPlaylists => [...prevPlaylists]);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  const handleVote = async (track: Song, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/${voteType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          SpotifyID: track.id,
          Code: PartyCode
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${voteType}`);
      }

      const result = await response.json();
      
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
    try {
      const response = await fetch(`/api/join-party/${playlistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update parent state through callback
        if (onPartyJoin && data.partyCode) {
          await onPartyJoin(data.partyCode, playlistId);
        }

        // Clear existing tracks
        setHotTracks([]);
        setHotVotes([]);
        setPlayedTracks([]);
        
        // Refresh hot tracks with new party code
        const refreshResponse = await fetch(`/api/dashboard/${encodeURIComponent(data.partyCode)}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setHotTracks(refreshData.HotJson);
          setHotVotes(refreshData.HotVotes);
          setPlayedTracks(refreshData.PlayedJson);
        }
        
        // Force a complete page refresh with the new party code
        router.push(`/dashboard?code=${data.partyCode}`);
      } else {
        console.error('Failed to join playlist');
      }
    } catch (error) {
      console.error('Error joining playlist:', error);
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
      <Tabs className='mt-24'>
        <TabList>
          <Tab style={{minWidth:"50%"}} className='text-white font-bold text-xl text-center'>Dashboard</Tab>
          <Tab style={{minWidth:"50%"}} className='text-white font-bold text-xl text-center'>Playlists</Tab>
        </TabList>
        <TabPanel>
          <div className="dashboard-content">
            <h2 className="section-title">Now Playing</h2>
            <div className="playlist-section overflow-auto">
              <div className="playlist-container overflow-y-scroll">
                {playedTracks && playedTracks.length > 0 ? (
                  <div className="flex flex-wrap gap-4 p-4">
                    {playedTracks.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        showVoting={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center w-full py-8">
                    No songs are currently playing. Add some songs to get started!
                  </div>
                )}
              </div>
            </div>

            <h2 className="section-title">Hot Tracks</h2>
            <div className="playlist-section overflow-auto">
              <div className="playlist-container !overflow-y-scroll max-h-[500px]">
                {hotTracks.length > 0 ? (
                  <div className="hot-tracks-list">
                    {hotTracks.map((song) => {
                      const vote = hotVotes.find(v => v.SongID === song.id);
                      const voteCount = vote?.Votes ?? song.Votes ?? 0;
                      
                      return (
                        <div key={song.id} className="hot-track-item">
                          <div className="track-info">
                            <img 
                              src={song.image || song.album?.images[0]?.url || '/default-album.png'} 
                              alt={`${song.name} album art`} 
                              className="track-image"
                              loading="lazy"
                            />
                            <div className="track-details">
                              <h3 className="track-name" title={song.name}>{song.name}</h3>
                              <p className="track-artist" title={song.artists.map(artist => artist.name).join(', ')}>
                                {song.artists.map(artist => artist.name).join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className="vote-controls">
                            <button
                              className={`vote-button upvote ${vote?.Selected === 'upvote' ? 'selected' : ''}`}
                              onClick={() => handleVote(song, 'upvote')}
                              aria-label="Upvote"
                            >
                              ↑
                            </button>
                            <span className="vote-count">{voteCount}</span>
                            <button
                              className={`vote-button downvote ${vote?.Selected === 'downvote' ? 'selected' : ''}`}
                              onClick={() => handleVote(song, 'downvote')}
                              aria-label="Downvote"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center w-full py-8">
                    No hot tracks yet. Add some songs and vote to see them here!
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="dashboard-content">
        {PartyCode && (
        <div className='party-code-container flex items-center gap-4 mb-8'>
          <h2 className="text-white text-xl">
            Party Code: <span className="text-[#FF6B6B] font-bold">{PartyCode}</span>
          </h2>
          <LeavePartyButton PartyCode={PartyCode} />
        </div>
        )}

        <h2 className="section-title">Playlists</h2>  
        <div className="playlist-section overflow-auto pt-24">
          <div className="playlist-container !overflow-y-scroll h-[500px]">
            {playlists.length > 0 ? (
              <>
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="playlist-row">
                    <div className="text-lg font-medium text-white">{playlist.name}</div>
                    <div className="text-gray-400 break-words">{playlist.description}</div>
                    <div className="flex items-center justify-center">
                      {playlist.code === PartyCode ? (
                        <button
                          className="bg-[#7B61FF] text-white px-6 py-2 rounded-md cursor-default whitespace-nowrap"
                          disabled
                          aria-label="Currently joined playlist"
                        >
                          Joined
                        </button>
                      ) : playlist.isJoined ? (
                        <button
                          className="bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors whitespace-nowrap"
                          onClick={() => handleJoinPlaylist(playlist.id)}
                          aria-label={`Re-join playlist ${playlist.name}`}
                        >
                          Re-Join
                        </button>
                      ) : (
                        <button
                          className="bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors whitespace-nowrap"
                          onClick={() => handleJoinPlaylist(playlist.id)}
                          aria-label={`Join playlist ${playlist.name}`}
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
              </>
              
            ) : (
              <div className="text-gray-500 text-center w-full py-8">
                No playlists available. Create one to get started!
              </div>
            )}
          </div>
          <div className='text-gray-500 text-center pt-10 flex flex-col items-center gap-4'>
              Have a party code? Join a playlist!
              <RainbowButton href='/join-party' text='Join the party' className='mt-4'/>
            </div>

        </div>
      </div>
        </TabPanel>
      </Tabs>
      
    </div>

  );
}