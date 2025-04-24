'use client' 
import React, { useState, useEffect, useRef } from 'react';
import { SongInterface } from '../interfaces/Song';

interface SearchBarProps {
  onSelect: (song: SongInterface) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SongInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (song: SongInterface) => {
    onSelect(song);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  return (
    <div className="search-container" ref={searchRef}>
      <div className="ui search">
        <div className="ui icon input">
          <input
            className="search-input"
            type="text"
            placeholder="Search songs, artists, playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
          />
          {isLoading ? (
            <i className="loading search icon"></i>
          ) : (
            <i className="search icon"></i>
          )}
        </div>
        {error && (
          <div className="error-message" style={{ color: 'red', marginTop: '0.5rem' }}>
            {error}
          </div>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className="results transition visible">
            {suggestions.map((song) => (
              <div
                key={song.id}
                className="result"
                onClick={() => handleSelect(song)}
              >
                <div className="content">
                  <div className="title">{song.name}</div>
                  <div className="description">
                    {song.artists.map((artist) => artist.name).join(', ')}
                  </div>
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