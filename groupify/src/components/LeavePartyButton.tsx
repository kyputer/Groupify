import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearPartyCode } from '@/lib/features/partySlice';

interface LeavePartyButtonProps {
  PartyCode: string;
  onLeave?: () => void; // Optional callback to refresh data
}

export const LeavePartyButton = ({
  PartyCode,
  onLeave,
}: LeavePartyButtonProps) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLeaveParty = async () => {
    try {
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
        // Clear state and trigger callback for data refresh
        dispatch(clearPartyCode());

        // Call the callback to refresh playlist data
        if (onLeave) {
          onLeave();
        }

        router.push('/dashboard');
      } else {
        console.error('Failed to leave party:', result.error);
        // You could add user notification here
      }
    } catch (error) {
      console.error('Error leaving party:', error);
      // You could add user notification here
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
