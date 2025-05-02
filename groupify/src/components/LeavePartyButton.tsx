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
        await fetch(`/api/leave-party?code=${PartyCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: PartyCode }),
        });
        dispatch(clearPartyCode(PartyCode));
        router.push('/');
    }
    
    return (
        <button
            className="mt-2 text-blue-500 underline cursor-pointer hover:animate-rainbow"
            onClick={handleLeaveParty}
          >
            Leave Party
          </button>
    )
}