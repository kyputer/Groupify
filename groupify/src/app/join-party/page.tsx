'use client'
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPartyCode } from '@/lib/features/partySlice';

export default function Page() {
    const router = useRouter();
    const [party, setParty] = useState(['', '', '', '', '', '', '', '']);
    const [error, setError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const dispatch = useDispatch();
    const handleJoinParty = async () => {
        const code = party.join('');
        if (code.length !== 8) {
            setError('Please enter a valid party code');
            return;
        }

        const response = await fetch(`/api/join-party?code=${code}`);
        const data = await response.json();

        if (response.ok) {
            dispatch(setPartyCode(code));
            setError('');
            router.push('/dashboard');
        } else {
            if (data.error) {
                setError(data.error);
            } else {
                setError('Party not found');
            }
            
        }
    };

    const handleInputChange = (index: number, value: string) => {
        const newParty = [...party];
        newParty[index] = value
        setParty(newParty);

        // Move to next input if current input is filled
        if (value && index < 7) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !party[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
                <h1 className="text-2xl font-bold mb-4 pt-6">Join the Party</h1>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <div className="flex gap-2 mb-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={party[index]}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-12 border-2 border-gray-300 rounded-md text-center text-xl font-bold focus:border-[#7B61FF] focus:outline-none text-white"
                        />
                    ))}
                </div>
                <button 
                    className="bg-[#FF6B6B] text-white px-4 py-2 rounded-md hover:bg-[#fd4343]"
                    onClick={handleJoinParty}
                >
                    Join Party
                </button>
                
            </div>
        </div>
    )
}
