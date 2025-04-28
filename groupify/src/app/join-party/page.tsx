'use client'
import { useState } from 'react';

export default function Page() {
    const [partyCode, setPartyCode] = useState('');
    const [error, setError] = useState('');

    const handleJoinParty = () => {
        if (partyCode.trim() === '') {
            setError('Please enter a valid party code');
            return;
        }

        // TODO: Implement party code validation and joining logic
        console.log(`Joining party with code: ${partyCode}`);
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
