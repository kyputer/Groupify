import { Song } from '../interfaces/Song';
import { Vote } from '../interfaces/Vote';
import VoteButtons from './VoteButtons';
import { formatDuration } from '../lib/utils';

interface SongCardProps {
  song: Song;
  vote?: Vote;
  voteCount?: number;
  onVote?: (song: Song, voteType: 'upvote' | 'downvote') => Promise<void>;
  showVoting?: boolean;
}

export default function SongCard({ song, vote, voteCount = 0, onVote, showVoting = true }: SongCardProps) {
  const cardContent = (
    <div className="song-card flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <img 
        src={song.image || song.album?.images[0]?.url || '/default-album.png'} 
        alt={`${song.name} album art`} 
        className="w-24 h-24 rounded-md object-cover"
      />
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{song.name}</h3>
          {song.explicit ? (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
              E
            </span>
          ) : (
            null
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{song.artists.map(artist => artist.name).join(', ')}</p>
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDuration(song.duration_ms)}</span>
      </div>
      {showVoting && onVote && (
        <VoteButtons
          song={song}
          vote={vote}
          voteCount={voteCount}
          onVote={onVote}
        />
      )}
    </div>
  );

  if (!showVoting) {
    return (
      <a 
        href={song.external_urls.spotify} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
} 