'use client'

import { useState } from 'react';

export default function Page() {
    const [partyCode, setPartyCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const generatePartyCode = async () => {
        const response = await fetch('/api/generate-party-code',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ UserID: 1 })
            }
        );
        const result = await response.json();

        if (result.success) {
            setPartyCode(result.code);
        } else {
            setError(result.error);
        }
    };

    return (
        <div>
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center"></div>
                <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
                <h1 className="text-2xl font-bold mb-4 pt-6 text-center">Generate Party</h1>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <p className="mb-4 text-center">Generate a party code to invite your friends to join you.</p>

                
                <button className="bg-[#FF6B6B] text-white px-4 py-2 rounded-md hover:bg-[#fd4343]" onClick={generatePartyCode}>Generate Party</button>
                {partyCode && (
                    <p className="mb-4 text-center text-white bg-gray-800 px-4 py-2 rounded-md mt-4">Party code: <b className="font-bold text-[#FF6B6B] text-xl">{partyCode}</b></p>
                )}
            </div>
        </div>
    )
}