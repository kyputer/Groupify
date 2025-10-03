'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'; // No need to import 'react-tabs/style/react-tabs.css' as a module
import { Playlist } from '../interfaces/Playlist';
import { Song } from '../interfaces/Song';
import { Vote } from '../interfaces/Vote';
import { LeavePartyButton } from './LeavePartyButton';
import { LogOutButton } from './LogOutButton';
import SearchBar from './SearchBar';
import SongCard from './SongCard';
// import "react-tabs/style/react-tabs.css";
import Page from '@/app/join-party/page';
import { ClosePartyButton } from './CloseParty';
import { RainbowButton } from './RainbowButton';
interface DashboardProps {
  PlayedJson: Song[];
  HotJson: Song[];
  HotVotes: Vote[];
  UserID: string;
  PartyCode: string;
  PlaylistID: string;
  isOwner: boolean;
  onPartyJoin?: (partyCode: string, playlistId: string) => void;
}

export default function DashboardPage({
  PlayedJson,
  HotJson,
  HotVotes,
  UserID,
  PartyCode,
  PlaylistID,
  onPartyJoin,
  isOwner,
}: DashboardProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [hotTracks, setHotTracks] = useState<Song[]>(HotJson);
  const [hotVotes, setHotVotes] = useState<Vote[]>(HotVotes);
  const [playedTracks, setPlayedTracks] = useState<Song[]>(PlayedJson);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const authChecked = useRef(false);
  const router = useRouter();

  // This single useEffect handles the entire authentication and data fetching flow.
  useEffect(() => {
    // Prevent this effect from running multiple times in development
    if (authChecked.current) return;
    authChecked.current = true;

    const checkAuthAndFetchData = async () => {
      try {
        // 1. Check authentication status
        const authResponse = await fetch('/api/auth/check', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        const authData = await authResponse.json();
        if (!authResponse.ok || !authData.authenticated) {
          router.push('/login');
          return; // Stop execution if not authenticated
        }
        setIsAuthenticated(true);

        // 2. Fetch playlists now that we are authenticated
        const playlistsResponse = await fetch('/api/playlists', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!playlistsResponse.ok) {
          console.warn('Failed to fetch playlists, but continuing...');
          setPlaylists([]); // Set empty array if fetch fails
          return;
        }

        const playlistsData = await playlistsResponse.json();

        // Handle case where no playlists exist (e.g., after reset)
        if (!Array.isArray(playlistsData) || playlistsData.length === 0) {
          setPlaylists([]);
          return;
        }

        // Sort playlists: joined ones first, then by creation date
        const sortedPlaylists = playlistsData.sort((a: any, b: any) => {
          if (a.code === PartyCode && b.code !== PartyCode) return -1;
          if (a.code !== PartyCode && b.code === PartyCode) return 1;
          if (a.isJoined && !b.isJoined) return -1;
          if (!a.isJoined && b.isJoined) return 1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setPlaylists(sortedPlaylists);
      } catch (error) {
        console.error('Auth check or data fetch failed:', error);
        // On any critical failure, redirect to login
        router.push('/login');
      }
    };

    checkAuthAndFetchData();
  }, [router, PartyCode]); // Dependencies for the effect

  const fetchPlaylists = useCallback(
    async (forceRefresh = false) => {
      try {
        const url = forceRefresh
          ? '/api/playlists?refresh=true'
          : '/api/playlists';
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }
        const data = await response.json();
        // Sort playlists: joined ones first, then by creation date
        const sortedPlaylists = data.sort((a: Playlist, b: Playlist) => {
          // First sort by joined status
          if (a.code === PartyCode && b.code !== PartyCode) return -1;
          if (a.code !== PartyCode && b.code === PartyCode) return 1;
          if (a.isJoined && !b.isJoined) return -1;
          if (!a.isJoined && b.isJoined) return 1;
          // Then sort by creation date
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setPlaylists(sortedPlaylists);
      } catch (err) {
        console.error('Error fetching playlists:', err);
      }
    },
    [PartyCode]
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    }
  }, [isAuthenticated, fetchPlaylists]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const refreshHotTracks = async () => {
    try {
      const encodedCode = encodeURIComponent(PartyCode);
      const response = await fetch(`/api/dashboard/${encodedCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
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
          Code: PartyCode,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${voteType}`);
      }

      const result = await response.json();

      // Update the local state with the new vote count
      setHotTracks(prevTracks =>
        prevTracks.map(t =>
          t.id === track.id ? { ...t, Votes: result.votes } : t
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
                  SpotifyID: track.id,
                }
              : v
          );
        } else {
          // Add new vote
          return [
            ...prevVotes,
            {
              SongID: track.id,
              SpotifyID: track.id,
              Votes: result.votes,
              Selected: result.voteType,
            },
          ];
        }
      });

      // Refresh hot tracks to ensure we have the latest data
      await refreshHotTracks();
    } catch (error) {
      console.error(`Error ${voteType}ing track:`, error);
      alert(
        `Failed to ${voteType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const handleJoinPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/join-party/${playlistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
        const refreshResponse = await fetch(
          `/api/dashboard/${encodeURIComponent(data.partyCode)}`
        );
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setHotTracks(refreshData.HotJson);
          setHotVotes(refreshData.HotVotes);
          setPlayedTracks(refreshData.PlayedJson);
        }

        // Refresh playlists to update join status
        await fetchPlaylists(true);

        // Switch to dashboard tab after joining
        setTabIndex(0);

        // Navigate to dashboard with the new party code
        router.push(`/dashboard?code=${data.partyCode}`);
      } else {
        console.error('Failed to join playlist');
      }
    } catch (error) {
      console.error('Error joining playlist:', error);
    }
  };

  // Find the current playlist object by PlaylistID or PartyCode
  const currentPlaylist = playlists.find(
    p => String(p.id) === String(PlaylistID) || p.code === PartyCode
  );
  const isPlaylistSelected = !!currentPlaylist;

  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard Debug:', {
      PlaylistID,
      PartyCode,
      playlistsCount: playlists.length,
      currentPlaylist: currentPlaylist
        ? { id: currentPlaylist.id, code: currentPlaylist.code }
        : null,
      isPlaylistSelected,
    });
  }

  // Add setTabIndex function for Tab navigation
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <div className='dashboard-container bg-white dark:bg-gray-900'>
      <nav className='navbar'>
        <div className='navbar-left mb-auto'>
          <h1 className='logo text-4xl'>Groupify</h1>
        </div>
        <div className='navbar-center'>
          {isPlaylistSelected ? (
            <SearchBar
              UserID={UserID}
              playlistID={PlaylistID}
              onTrackAdded={refreshHotTracks}
              playlistName={currentPlaylist?.name || ''}
              playlistDescription={currentPlaylist?.description || ''}
              playlistIsPublic={currentPlaylist?.isPublic ?? false}
            />
          ) : (
            <div className='mt-4 text-red-500'>
              Please select or join a playlist to add tracks.
            </div>
          )}
        </div>
        <div className='navbar-right flex items-center justify-center'>
          {isOwner && <ClosePartyButton PlaylistId={PlaylistID} />}
          <LogOutButton />
        </div>
      </nav>
      <Tabs
        selectedIndex={tabIndex}
        onSelect={setTabIndex}
        className={`${isMobile ? 'relative mt-24 pb-20' : 'mt-24'}`}
      >
        <TabList
          className={`${isMobile ? 'fixed right-0 bottom-0 left-0 z-[1000] flex items-center justify-center border-t border-gray-700 bg-gray-900' : 'flex items-center justify-center border-b border-gray-700'}`}
        >
          <Tab
            style={{ minWidth: '33%' }}
            className={`flex flex-col items-center gap-1 py-4 text-center text-xl font-bold text-white transition-colors hover:bg-gray-800 ${isMobile ? '' : 'px-8'}`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect x='3' y='3' width='7' height='7'></rect>
              <rect x='14' y='3' width='7' height='7'></rect>
              <rect x='14' y='14' width='7' height='7'></rect>
              <rect x='3' y='14' width='7' height='7'></rect>
            </svg>
            <span className='text-xs'>Dashboard</span>
          </Tab>
          <Tab
            style={{ minWidth: '33%' }}
            className={`flex flex-col items-center gap-1 py-4 text-center text-xl font-bold text-white transition-colors hover:bg-gray-800 ${isMobile ? '' : 'px-8'}`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M3 3h18v18H3z'></path>
              <path d='M3 9h18'></path>
              <path d='M9 21V9'></path>
            </svg>
            <span className='text-xs'>Playlists</span>
          </Tab>
          <Tab
            style={{ minWidth: '33%' }}
            className={`flex flex-col items-center gap-1 py-4 text-center text-xl font-bold text-white transition-colors hover:bg-gray-800 ${isMobile ? '' : 'px-8'}`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path>
              <circle cx='9' cy='7' r='4'></circle>
              <path d='M23 21v-2a4 4 0 0 0-3-3.87'></path>
              <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
            </svg>
            <span className='text-xs'>Join Party</span>
          </Tab>
        </TabList>
        <TabPanel className={isMobile ? 'pb-16' : ''}>
          <div className='dashboard-content first-panel'>
            <h2 className='section-title'>Now Playing</h2>
            <div className='playlist-section overflow-auto'>
              <div className='playlist-container overflow-y-scroll'>
                {playedTracks && playedTracks.length > 0 ? (
                  <div className='flex flex-wrap gap-4 p-4'>
                    {playedTracks.map(song => (
                      <SongCard key={song.id} song={song} showVoting={false} />
                    ))}
                  </div>
                ) : (
                  <div className='w-full py-8 text-center text-gray-500'>
                    No songs are currently playing. Add some songs to get
                    started!
                  </div>
                )}
              </div>
            </div>

            <h2 className='section-title'>Hot Tracks</h2>
            <div className='playlist-section overflow-auto'>
              <div className='playlist-container !overflow-y-scroll'>
                {hotTracks.length > 0 ? (
                  <div className='hot-tracks-list'>
                    {hotTracks.map(song => {
                      const vote = hotVotes.find(v => v.SongID === song.id);
                      const voteCount = vote?.Votes ?? song.Votes ?? 0;

                      return (
                        <div key={song.id} className='hot-track-item'>
                          <div className='track-info'>
                            <img
                              src={
                                song.image ||
                                song.album?.images[0]?.url ||
                                '/default-album.png'
                              }
                              alt={`${song.name} album art`}
                              className='track-image'
                              loading='lazy'
                            />
                            <div className='track-details'>
                              <h3 className='track-name' title={song.name}>
                                {song.name}
                              </h3>
                              <p
                                className='track-artist'
                                title={song.artists
                                  .map(artist => artist.name)
                                  .join(', ')}
                              >
                                {song.artists
                                  .map(artist => artist.name)
                                  .join(', ')}
                              </p>
                            </div>
                          </div>
                          <div className='vote-controls'>
                            <button
                              className={`vote-button upvote ${
                                vote?.Selected === 'upvote' ? 'selected' : ''
                              }`}
                              onClick={() => handleVote(song, 'upvote')}
                              aria-label='Upvote'
                            >
                              ↑
                            </button>
                            <span className='vote-count'>{voteCount}</span>
                            <button
                              className={`vote-button downvote ${
                                vote?.Selected === 'downvote' ? 'selected' : ''
                              }`}
                              onClick={() => handleVote(song, 'downvote')}
                              aria-label='Downvote'
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className='w-full py-8 text-center text-gray-500'>
                    No hot tracks yet. Add some songs and vote to see them here!
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel className={isMobile ? 'pb-16' : ''}>
          <div className='dashboard-content'>
            {PartyCode && (
              <div className='party-code-container mb-8 flex items-center gap-4'>
                <h2 className='text-xl text-white'>
                  Party Code:{' '}
                  <span className='font-bold text-[#FF6B6B]'>{PartyCode}</span>
                </h2>
                <LeavePartyButton
                  PartyCode={PartyCode}
                  onLeave={() => fetchPlaylists(true)}
                />
              </div>
            )}

            <h2 className='section-title'>Playlists</h2>
            <div className='playlist-section overflow-auto pt-24'>
              <div className='playlist-container max-h-[500px] !overflow-y-scroll'>
                {playlists.length > 0 ? (
                  <>
                    {playlists.map(playlist => (
                      <div key={playlist.id} className='playlist-row'>
                        <div className='text-lg font-medium text-white'>
                          {playlist.name}
                        </div>
                        <div className='break-words text-gray-400'>
                          {playlist.description}
                        </div>
                        <div className='flex items-center justify-center'>
                          {playlist.code === PartyCode ? (
                            <button
                              className='cursor-default rounded-md bg-[#7B61FF] px-6 py-2 whitespace-nowrap text-white'
                              disabled
                              aria-label='Currently joined playlist'
                            >
                              Joined
                            </button>
                          ) : playlist.isJoined ? (
                            <button
                              className='rounded-md bg-gray-700 px-6 py-2 whitespace-nowrap text-white transition-colors hover:bg-gray-600'
                              onClick={() =>
                                handleJoinPlaylist(playlist.id.toString())
                              }
                              aria-label={`Re-join playlist ${playlist.name}`}
                            >
                              Re-Join
                            </button>
                          ) : (
                            <button
                              className='rounded-md bg-gray-700 px-6 py-2 whitespace-nowrap text-white transition-colors hover:bg-gray-600'
                              onClick={() =>
                                handleJoinPlaylist(playlist.id.toString())
                              }
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
                  <div className='w-full py-8 text-center text-gray-500'>
                    No playlists available. Create one to get started!
                  </div>
                )}
              </div>
              <div className='flex flex-col items-center gap-4 pt-10 text-center text-gray-500'>
                Want to start a party?
                <RainbowButton
                  href='/generate-party'
                  text='Start a party!'
                  className='mt-4'
                />
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel className={isMobile ? 'pb-16' : ''}>
          <div className='dashboard-content'>
            <Page setTabIndex={setTabIndex} />
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
