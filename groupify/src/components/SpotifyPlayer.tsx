'use client';

import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface SpotifyPlayerProps {
  PartyCode: string;
  PlaylistID: string;
  tracks: any[]; // Hot tracks that can be played
}

export const SpotifyPlayer = ({ PartyCode, PlaylistID, tracks }: SpotifyPlayerProps) => {
  const [player, setPlayer] = useState<any>(null);
  const [is_paused, setPaused] = useState(false);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isSDKReady, setSDKReady] = useState(false);
  const playerRef = useRef<any>(null);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    // Check if SDK is already loaded
    if (window.Spotify) {
      setSDKReady(true);
      initializePlayer();
      return;
    }

    // Load SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      setSDKReady(true);
      initializePlayer();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const initializePlayer = async () => {
    try {
      // Get access token from your API
      const tokenResponse = await fetch('/api/spotify/token', {
        credentials: 'include'
      });
      
      if (!tokenResponse.ok) {
        console.error('Failed to get Spotify token');
        return;
      }

      const { access_token } = await tokenResponse.json();

      const spotifyPlayer = new window.Spotify.Player({
        name: `Groupify - ${PartyCode}`,
        getOAuthToken: (cb: (token: string) => void) => {
          cb(access_token);
        },
        volume: 0.5
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }: any) => {
        console.error('Spotify Player initialization error:', message);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }: any) => {
        console.error('Spotify Player authentication error:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }: any) => {
        console.error('Spotify Player account error:', message);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        setTrack(state.track_window.current_track);
        setPaused(state.paused);

        // Auto-play next track when current ends
        if (state.position === 0 && state.paused) {
          playNextTrack();
        }
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: any) => {
        console.log('Spotify Player ready with Device ID:', device_id);
        setDeviceId(device_id);
        setActive(true);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: any) => {
        console.log('Spotify Player not ready with Device ID:', device_id);
        setActive(false);
      });

      // Connect to the player
      const connected = await spotifyPlayer.connect();
      
      if (connected) {
        console.log('Successfully connected to Spotify');
        setPlayer(spotifyPlayer);
        playerRef.current = spotifyPlayer;
      }

    } catch (error) {
      console.error('Error initializing Spotify player:', error);
    }
  };

  const playTrack = async (spotifyId: string) => {
    if (!deviceId || !player) {
      console.error('Spotify player not ready');
      return;
    }

    try {
      // Use Spotify Web API to start playback
      const response = await fetch('/api/spotify/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: deviceId,
          track_uri: `spotify:track:${spotifyId}`,
          playlist_id: PlaylistID
        }),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('Started playback for track:', spotifyId);
        // Mark track as played in your database
        await markTrackAsPlayed(spotifyId);
      } else {
        console.error('Failed to start playback');
      }
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const playNextTrack = async () => {
    // Get the highest voted unplayed track
    const nextTrack = tracks
      .filter(track => !track.played)
      .sort((a, b) => (b.Votes || 0) - (a.Votes || 0))[0];

    if (nextTrack) {
      await playTrack(nextTrack.id);
    }
  };

  const markTrackAsPlayed = async (spotifyId: string) => {
    try {
      await fetch('/api/tracks/mark-played', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotify_id: spotifyId,
          playlist_id: PlaylistID
        }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error marking track as played:', error);
    }
  };

  const togglePlayback = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const skipToNext = () => {
    if (player) {
      playNextTrack();
    }
  };

  const skipToPrevious = () => {
    if (player) {
      player.previousTrack();
    }
  };

  if (!isSDKReady) {
    return (
      <div className="spotify-player loading">
        <p>Loading Spotify Player...</p>
      </div>
    );
  }

  if (!is_active) {
    return (
      <div className="spotify-player inactive">
        <p>Connect to Spotify to control playback</p>
        <button onClick={initializePlayer} className="btn btn-primary">
          Connect Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="spotify-player bg-gray-800 p-4 rounded-lg">
      <div className="player-info mb-4">
        {current_track && (
          <div className="track-info flex items-center gap-4">
            <img 
              src={current_track.album.images[0]?.url} 
              alt={current_track.name}
              className="w-16 h-16 rounded"
            />
            <div>
              <h3 className="text-white font-semibold">{current_track.name}</h3>
              <p className="text-gray-400">{current_track.artists[0]?.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="player-controls flex items-center justify-center gap-4">
        <button 
          onClick={skipToPrevious}
          className="text-white hover:text-gray-300"
        >
          ⏮️
        </button>
        
        <button 
          onClick={togglePlayback}
          className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center text-xl hover:bg-gray-200"
        >
          {is_paused ? '▶️' : '⏸️'}
        </button>
        
        <button 
          onClick={skipToNext}
          className="text-white hover:text-gray-300"
        >
          ⏭️
        </button>
      </div>

      <div className="queue-info mt-4 text-center">
        <button 
          onClick={playNextTrack}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Play Next Track
        </button>
      </div>
    </div>
  );
};