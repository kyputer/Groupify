import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearPartyCode } from '@/lib/features/partySlice';

interface LeavePartyButtonProps {
  PartyCode: string;
  onLeave?: () => void;
}

export const LeavePartyButton = ({
  PartyCode,
  onLeave,
}: LeavePartyButtonProps) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLeaveParty = async () => {
    try {
      console.log('Starting leave party process...');

      // First clear Redux state immediately to prevent UI confusion
      dispatch(clearPartyCode());

      const response = await fetch(`/api/leave-party`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ PartyCode: PartyCode }),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Successfully left party');

        // Force a hard refresh of playlists with cache busting
        if (onLeave) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
          onLeave();
        }

        // Navigate away from current party
        router.push('/dashboard');
      } else {
        console.error('Failed to leave party:', result.error);
        // Restore Redux state if API call failed
        // You might want to re-fetch the current state here
      }
    } catch (error) {
      console.error('Error leaving party:', error);
      // Handle error - maybe restore state or show user notification
    }
  };

  return (
    <button
      className='rounded-md bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-700'
      onClick={handleLeaveParty}
    >
      Leave Party
    </button>
  );
};
