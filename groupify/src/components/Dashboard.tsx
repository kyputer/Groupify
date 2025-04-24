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

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-left">
          <h1 className="logo">Groupify</h1>
        </div>
        <div className="navbar-center">
          <SearchBar onSelect={handleSongSelect} />
        </div>
        <div className="navbar-right">
          <button className="refresh-button">
            <i className="fa-solid fa-rotate"></i>
          </button>
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
          <div className="hot-tracks-container">
            {HotJson.map((song, index) => (
              <div key={song.id} className="hot-track-card">
                <div className="vote-controls">
                  <button 
                    className="vote-button upvote"
                    onClick={() => handleUpvote(song.id)}
                  >
                    <i className="fa-solid fa-chevron-up"></i>
                  </button>
                  <div className="vote-count">
                    {HotVotes[index]?.Votes || 0}
                  </div>
                  <button 
                    className="vote-button downvote"
                    onClick={() => handleDownvote(song.id)}
                  >
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                </div>
                <a href={song.external_urls.spotify} className="track-info">
                  <div className="track-name">{song.name}</div>
                  <div className="track-artist">{song.artists[0].name}</div>
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