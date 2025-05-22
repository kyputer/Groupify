import { useRouter } from 'next/navigation';   
import { useDispatch } from 'react-redux';
import { clearPartyCode } from '@/lib/features/partySlice';


interface LeavePartyButtonProps {
    PartyCode: string;
}


export const LeavePartyButton = ({ PartyCode }: LeavePartyButtonProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    
    const handleLeaveParty = async () => {
        await fetch(`/api/leave-party`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ PartyCode: PartyCode}),
            credentials: 'include'
        });
        dispatch(clearPartyCode());
        router.push('/dashboard');
    }
    
    return (
        <button
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={handleLeaveParty}
          >
            Leave Party
          </button>
    )
}