'use client'

import { useState } from 'react';

export default function Page() {
    const [partyCode, setPartyCode] = useState<string | null>(null);

    const generatePartyCode = async () => {
        const response = await fetch('/api/generate-party-code',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        const code = await response.json();
        console.log(code);
        setPartyCode(code.code);
    };

    return (
        <div>
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center"></div>
                <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
                <h1 className="text-2xl font-bold mb-4 pt-6 text-center">Generate Party</h1>
                <p className="mb-4 text-center">Generate a party code to invite your friends to join you.</p>

                {partyCode && (
                    <p className="mb-4 text-center text-white bg-gray-800 px-4 py-2 rounded-md">Party code: {partyCode}</p>
                )}
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600" onClick={generatePartyCode}>Generate Party</button>
            </div>
        </div>
    )
}