import { SongInterface } from '../interfaces/Song';
import { Vote } from '../interfaces/Vote';
import SearchBar from './SearchBar';

interface DashboardProps {
  PlayedJson: SongInterface[];
  HotJson: SongInterface[];
  HotVotes: Vote[];
  UserID: string;
}

const Dashboard: React.FC<DashboardProps> = ({ PlayedJson, HotJson, HotVotes, UserID }) => {
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

  const handleSongSelect = (song: SongInterface) => {
    fetch('/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: song.name }),
    });
  };

  const HotSongs = HotVotes.sort((a, b) => b.Votes - a.Votes).map((vote) => {
    const song = HotJson.find(song => song.id === vote.SongID);
    return Object.assign({}, vote, song);
  });

  return (
    <div className="dashboard-container bg-white dark:bg-gray-900">
      <nav className="navbar">
        <div className="navbar-left mb-auto">
          <h1 className="logo">Groupify</h1>
        </div>
        <div className="navbar-center">
          <SearchBar onSelect={handleSongSelect} />
        </div>
        <div className="navbar-right">
        </div>
      </nav>

      <div className="dashboard-content">
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
                    <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 15 7-7 7 7"/>
</svg>

                  </button>
                  <div className="vote-count">
                    {song.Votes || 1}
                  </div>
                  <button 
                    className={`vote-button downvote ${song.Selected === 'down' ? 'selected' : ''}`}
                    onClick={() => handleDownvote(song.id)}
                  >
                    <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7"/>
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
};

export default Dashboard;