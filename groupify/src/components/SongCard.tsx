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

export default function SongCard({
  song,
  vote,
  voteCount = 0,
  onVote,
  showVoting = true,
}: SongCardProps) {
  const cardContent = (
    <div className='song-card flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800'>
      <img
        src={song.image || song.album?.images[0]?.url || '/default-album.png'}
        alt={`${song.name} album art`}
        className='h-24 w-24 rounded-md object-cover'
      />
      <div className='flex-1 pr-4'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            {song.name}
          </h3>
          {song.explicit ? (
            <span className='rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200'>
              E
            </span>
          ) : null}
        </div>
        <p className='text-sm text-gray-600 dark:text-gray-300'>
          {song.artists.map(artist => artist.name).join(', ')}
        </p>
        <span className='text-sm text-gray-500 dark:text-gray-400'>
          {formatDuration(song.duration_ms)}
        </span>
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
        target='_blank'
        rel='noopener noreferrer'
        className='block transition-opacity hover:opacity-90'
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
}
