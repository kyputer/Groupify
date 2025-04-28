'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
    const router = useRouter();
    const [partyCode, setPartyCode] = useState('');
    const [error, setError] = useState('');

    const handleJoinParty = async () => {
        if (partyCode.trim() === '') {
            setError('Please enter a valid party code');
            return;
        }

        const response = await fetch(`/api/join-party?code=${partyCode}`);
        const data = await response.json();

        if (response.ok) {
            setError('');
            router.push('/dashboard');
        } else {
            setError(data.error);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
                <h1 className="text-2xl font-bold mb-4 pt-6">Join the Party</h1>
                <input
                    type="text"
                value={partyCode}
                onChange={(e) => setPartyCode(e.target.value)}
                placeholder="Enter party code"
            />
            <button onClick={handleJoinParty}>Join Party</button>
                {error && <p className="text-red-500">{error}</p>}
            </div>
        </div>
    )
}
