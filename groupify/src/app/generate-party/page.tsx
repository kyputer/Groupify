'use client'

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPartyCodeOwner, clearPartyCode, setPlaylistID } from '@/lib/features/partySlice';
import { RootState } from '@/lib/store';
import { BooleanDropdown } from '@/components/BooleanDropdown';
import { CopyButton } from '@/components/CopyButton';
import { validateInput } from '@/lib/utils';


export default function Page() {
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const dispatch = useDispatch();
    const userId = useSelector((state: RootState) => state.user.userId);
    const partyTimestamp = useSelector((state: RootState) => state.party.timestamp);
    const selectedPartyCode = useSelector((state: RootState) => state.party.selectedPartyCode);
    const [isPublic, setIsPublic] = useState(true);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
       setDescription(e.target.value);
    };

    const generatePartyCode = async () => {
        setError(null);

        // Validate inputs
        if (!validateInput(name, 32)) {
            setError('Please enter a valid party name (1-32 characters)');
            return;
        }

        // Description is optional, but if provided, validate it
        if (description && !validateInput(description, 256)) {
            setError('Description must be between 1 and 256 characters');
            return;
        }

        try {
            const response = await fetch('/api/generate-party-code',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        UserID: userId, 
                        isPublic: isPublic,
                        Name: name,
                        Description: description || '' // Send empty string if no description
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to generate party code');
            }

            const result = await response.json();

            if (result.success) {
                setName('');
                setDescription('');
                dispatch(setPartyCodeOwner(result.code));
                dispatch(setPlaylistID(result.playlistID.id));
            } else {
                setError(result.error || 'Failed to generate party code');
            }
        } catch (err) {
            setError('An error occurred while generating the party code');
            console.error('Error generating party code:', err);
        }
    };

    let isPartyCodeExpired = true;
    if (partyTimestamp !== null) {
        isPartyCodeExpired = new Date(partyTimestamp) < new Date(Date.now() - 1000 * 60 * 60);
    }
    const isPartyCodeEmpty = selectedPartyCode === '';
    const isPartyCodeValid = (isPartyCodeExpired && isPartyCodeEmpty);

    return (
        <div>
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center"></div>
                <h1 className="text-9xl font-bold mb-4 logo">Groupify</h1>
                <h1 className="text-2xl font-bold mb-4 pt-6 text-center">Generate Party</h1>
                {error && <p className="text-red-500 mt-2">{error}</p>}
                <p className="mb-4 text-center">Generate a party code to invite your friends to join you.</p>
                
                {isPartyCodeValid && (
                    <div className="w-full max-w-md space-y-4 mb-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Party Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                maxLength={32}
                                value={name}
                                onChange={handleNameChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF6B6B] focus:border-[#FF6B6B] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter party name"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">{name.length}/32 characters</p>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                maxLength={256}
                                value={description}
                                onChange={handleDescriptionChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF6B6B] focus:border-[#FF6B6B] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter party description"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500 mt-1">{description.length}/256 characters</p>
                        </div>

                        <BooleanDropdown
                            value={isPublic}
                            onChange={setIsPublic}
                            label="Party Visibility"
                            className="mb-4 justify-center"
                            labelPosition="left"
                            options={[
                                { label: 'Public', value: true },
                                { label: 'Private', value: false }
                            ]}
                        />
                    </div>
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
                            <p className="mb-4 text-center text-white bg-gray-800 px-4 py-2 rounded-md mt-4">Party code: <b className="font-bold text-[#FF6B6B] text-xl">{selectedPartyCode}</b></p>
                            <CopyButton value={selectedPartyCode} />
                        </div>
                        <button className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 ml-4" onClick={() => dispatch(clearPartyCode())}>Reset</button>
                    </div>
                )}
            </div>
        </div>
    )
}