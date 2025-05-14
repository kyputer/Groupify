import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import VoteButtons from './VoteButtons';

interface SongCardProps {
  song: Song;
  vote?: Vote;
  voteCount?: number;
  onVote?: (song: Song, voteType: 'upvote' | 'downvote') => Promise<void>;
  showVoting?: boolean;
}

export default function SongCard({ song, vote, voteCount, onVote, showVoting = false }: SongCardProps) {
  return (
    <div className="song-card bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 pr-4">
          <img
            src={song.album?.images[0]?.url || song.image}
            alt={song.name}
            className="w-16 h-16 rounded"
          />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{song.name}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {song.artists?.map(artist => artist.name).join(', ')}
            </p>
          </div>
        </div>
        {showVoting && onVote && (
          <VoteButtons
            song={song}
            vote={vote}
            voteCount={voteCount ?? 0}
            onVote={onVote}
          />
        )}
      </div>
    </div>
  );
} 