'use client'
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RootState } from '@/lib/store';
import { useDispatch, useSelector } from 'react-redux';
import { setPartyCode, setPlaylistID } from '@/lib/features/partySlice';

export default function Page() {
    const router = useRouter();
    const userId = useSelector((state: RootState) => state.user.userId);
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
        console.log(code.length, code);
        const response = await fetch('/api/join-party',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ UserID: userId, PartyCode: code })
            }
        );
        const result = await response.json();

        if (result.success) {
            dispatch(setPartyCode(code));
            dispatch(setPlaylistID(result.playlistID));
            setError('');
            router.push('/dashboard');
        } else {
            setError(result.error);
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

    const handleKeyDown = async (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
            e.preventDefault();
            const pastedText = await navigator.clipboard.readText();
            const newParty = [...party];
            for (let i = 0; i < pastedText.length && i < 8; i++) {
                newParty[i] = pastedText.charAt(i);
            }
            setParty(newParty);
            if (pastedText.length < 8) {
                inputRefs.current[pastedText.length]?.focus();
            } 
            
            return;
        }
        switch (e.key) {
            case 'Backspace':
                if (!party[index] && index > 0) {
                    // Move to previous input on backspace if current is empty
                    inputRefs.current[index - 1]?.focus();
                }
                break;
            case 'ArrowLeft':
                inputRefs.current[index - 1]?.focus();
                e.preventDefault();
                break;
            case 'ArrowRight':
                inputRefs.current[index + 1]?.focus();
                e.preventDefault();
                break;
            case 'Enter':
                e.preventDefault();
                handleJoinParty();
                break;
            default:
                if (/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\|]$/.test(e.key)) {
                    e.preventDefault();
                    const newParty = [...party];
                    newParty[index] = e.key;
                    setParty(newParty);
                    if (index < 7) {
                        inputRefs.current[index + 1]?.focus();
                    }
                }
                break;
        }
        
    };
    
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const newParty = [...party];
        for (let i = 0; i < text.length; i++) {
            newParty[i] = text.charAt(i);
        }
        setParty(newParty);
        inputRefs.current[text.length - 1]?.focus();
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
                            onPaste={handlePaste}
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
