import { useRouter } from 'next/navigation';   
import { useDispatch } from 'react-redux';
import { clearPartyCode } from '@/lib/features/partySlice';


interface ClosePartyButtonProps {
    PlaylistId: string;
}


export const ClosePartyButton = ({ PlaylistId }: ClosePartyButtonProps) => {
    const dispatch = useDispatch();
    const router = useRouter();
    
    const handleCloseParty = async () => {
        await fetch(`/api/close-party/${PlaylistId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        dispatch(clearPartyCode());
        router.push('/dashboard');
    }
    
    return (
        <button
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            onClick={handleCloseParty}
          >
            End Party
          </button>
    )
}