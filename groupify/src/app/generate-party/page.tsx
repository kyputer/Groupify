'use client'

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPartyCodeOwner, clearAllPartyCode } from '@/lib/features/partySlice';
import { RootState } from '@/lib/store';
import router from 'next/router';
import { BooleanDropdown } from '@/components/BooleanDropdown';
import { CopyButton } from '@/components/CopyButton';
export default function Page() {
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();
    const userId = useSelector((state: RootState) => state.user.userId);
    const partyCodeOwner = useSelector((state: RootState) => state.party.partyCode);
    const [isPublic, setIsPublic] = useState(true);
    const generatePartyCode = async () => {
        const response = await fetch('/api/generate-party-code',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ UserID: userId, isPublic: isPublic })
            }
        );
        const result = await response.json();

        if (result.success) {
            dispatch(setPartyCodeOwner(result.code));
        } else {
            setError(result.error);
        }
    };

    const isPartyCodeExpired = partyCodeOwner[partyCodeOwner.length - 1]?.timestamp < new Date(Date.now() - 1000 * 60 * 60);
    const isPartyCodeEmpty = partyCodeOwner[partyCodeOwner.length - 1]?.code === '';
    const isPartyCodeValid = (isPartyCodeExpired && !isPartyCodeEmpty) || partyCodeOwner.length === 0;
    console.log(isPartyCodeEmpty);
    return (
        <div>
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center"></div>
                <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
                <h1 className="text-2xl font-bold mb-4 pt-6 text-center">Generate Party</h1>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <p className="mb-4 text-center">Generate a party code to invite your friends to join you.</p>
                { isPartyCodeValid && (
                    <BooleanDropdown
                        value={isPublic}
                        onChange={setIsPublic}
                        label="Party Visibility"
                        labelPosition="left"
                        options={[
                            { label: 'Public', value: true },
                            { label: 'Private', value: false }
                        ]}
                    />
                )}
                <button 
                    className={`px-4 py-2 rounded-md ${!isPartyCodeValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF6B6B] hover:bg-[#fd4343]'} text-white`} 
                    onClick={generatePartyCode}
                    disabled={!isPartyCodeValid}
                >
                    Generate Party
                </button>

                {!isPartyCodeValid && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex flex-row items-center justify-center">
                        <p className="mb-4 text-center text-white bg-gray-800 px-4 py-2 rounded-md mt-4">Party code: <b className="font-bold text-[#FF6B6B] text-xl">{partyCodeOwner[partyCodeOwner.length - 1]?.code}</b></p>
                        <CopyButton value={partyCodeOwner[partyCodeOwner.length - 1]?.code} />
                        </div>
                        <button className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 ml-4" onClick={() => dispatch(clearAllPartyCode())}>Reset</button>
                    </div>
                )}
            </div>
        </div>
    )
}