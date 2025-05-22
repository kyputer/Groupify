'use client' 
import React, { useState, useEffect, useRef } from 'react';
import { SpotifyTrack } from '@/interfaces/SpotifyTrack';
import { formatDuration } from '@/lib/utils';

interface SearchBarProps {
  UserID: string;
  playlistID: string;
  onTrackAdded?: () => Promise<void>;
}

const SearchBar = ({ UserID, playlistID, onTrackAdded }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setError(null);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/search-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  const handleSelect = async (song: SpotifyTrack) => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);

    console.log("Selected song: ", song);
    try {
      const response = await fetch('/api/playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Track: song, PlaylistID: playlistID }),
      credentials: 'include'
    });

      if (!response.ok) {
        throw new Error('Failed to add track to playlist');
      }

      // Call the onTrackAdded callback if provided
      if (onTrackAdded) {
        await onTrackAdded();
      }
    } catch (error) {
      console.error('Error adding track:', error);
      setError('Failed to add track to playlist');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleTrackSelect = async (track: SpotifyTrack) => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);

    console.log("Selected song: ", track);
    try {
      const response = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Track: track, PlaylistID: playlistID, UserID: UserID }),
      });

      if (!response.ok) {
        throw new Error('Failed to add track to playlist');
      }

      // Call the onTrackAdded callback if provided
      if (onTrackAdded) {
        await onTrackAdded();
      }
    } catch (error) {
      console.error('Error adding track:', error);
      setError('Failed to add track to playlist');
    }
  };

  return (
    <div className="search-container relative" ref={searchRef}>
      <div className="ui search">
        <div className="ui input relative">
          <input
            className="search-input pl-12"
            type="text"
            placeholder="Search songs, artists, playlists..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setShowSuggestions(true);
              setIsFocused(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
                setIsFocused(false);
              }, 200);
            }}
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg 
              className="w-5 h-5 text-gray-400" 
              role="img" 
              aria-hidden="true" 
              viewBox="0 0 24 24"
            >
              <path 
                fill="currentColor"
                d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8235 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7138 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.55226 6.42768 3.27893 10.533 3.27893C14.6383 3.27893 17.94 6.55226 17.94 10.5579C17.94 14.5636 14.6383 17.8369 10.533 17.8369C6.42768 17.8369 3.12598 14.5636 3.12598 10.5579Z"
              />
            </svg>
          </div>
        </div>
        {error && (
          <div className="error-message" style={{ color: 'red', marginTop: '0.5rem' }}>
            {error}
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className={`search-results ${!isFocused ? 'hidden' : ''}`}>
            {suggestions.map((song) => (
              <div
                key={song.id}
                className="search-result-item"
                onClick={() => handleSelect(song)}
              >
                <img 
                  src={song.album.images[0]?.url || '/default-album.png'} 
                  alt={song.name}
                  className="search-result-image"
                />
                <div className="search-result-info">
                  <div className="search-result-name">
                    {song.name}
                    {song.explicit && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded ml-2">E</span>
                    )}
                  </div>
                  <div className="search-result-artist">
                    {song.artists.map((artist: any) => artist.name).join(' & ')}
                  </div>
                </div>
                <div className="text-gray-400 text-sm">
                  {formatDuration(song.duration_ms)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar; 