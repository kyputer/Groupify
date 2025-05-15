import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';

interface VoteButtonsProps {
  song: Song;
  vote: Vote | undefined;
  voteCount: number;
  onVote: (song: Song, voteType: 'upvote' | 'downvote') => Promise<void>;
}

export default function VoteButtons({ song, vote, voteCount, onVote }: VoteButtonsProps) {
  const selectedVote = vote?.Selected;
  
  return (
    <div className="flex flex-col items-center space-y-2 ml-4 mt-2 mr-4">
      <button
        onClick={() => onVote(song, 'upvote')}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          selectedVote === 'upvote'
            ? 'bg-[#FF6B6B] text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
        }`}
        aria-label="Upvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <span className="font-semibold text-center text-gray-900 dark:text-white py-1">
        {voteCount}
      </span>
      <button
        onClick={() => onVote(song, 'downvote')}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          selectedVote === 'downvote'
            ? 'bg-[#FF6B6B] text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
        }`}
        aria-label="Downvote"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
} 