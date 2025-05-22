'use client'

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPartyCodeOwner, clearPartyCode, setPlaylistID } from '@/lib/features/partySlice';
import { RootState } from '@/lib/store';
import { BooleanDropdown } from '@/components/BooleanDropdown';
import { CopyButton } from '@/components/CopyButton';
import { RainbowButton } from '@/components/RainbowButton';
import { validateInput } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function Page() {
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();
    const userId = useSelector((state: RootState) => state.user.userId);
    const partyTimestamp = useSelector((state: RootState) => state.party.timestamp);
    const selectedPartyCode = useSelector((state: RootState) => state.party.selectedPartyCode);
    const [isPublic, setIsPublic] = useState(true);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
                        isPublic: isPublic,
                        Name: name,
                        Description: description || '' // Send empty string if no description
                    }),
                    credentials: 'include'
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

    if (!isMounted) {
        return null;
    }

    return (
        <div className="generate-party-container">
            <div className="generate-party-content">
                <h1 className="generate-party-title">Generate Party</h1>
                <p className="generate-party-description">Generate a party code to invite your friends to join you.</p>
                
                {error && <p className="error-message">{error}</p>}
                
                {isPartyCodeValid && (
                    <div className="generate-party-form">
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">
                                Party Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                maxLength={32}
                                value={name}
                                onChange={handleNameChange}
                                className="form-input"
                                placeholder="Enter party name"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">{name.length}/32 characters</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                Description
                            </label>
                            <textarea
                                id="description"
                                maxLength={256}
                                value={description}
                                onChange={handleDescriptionChange}
                                className="form-input"
                                placeholder="Enter party description"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500 mt-1">{description.length}/256 characters</p>
                        </div>

                        <BooleanDropdown
                            value={isPublic}
                            onChange={setIsPublic}
                            label="Party Visibility"
                            className="mb-4"
                            labelPosition="left"
                            options={[
                                { label: 'Public', value: true },
                                { label: 'Private', value: false }
                            ]}
                        />

                        <button 
                            className={`generate-button ${!isPartyCodeValid ? 'disabled' : ''}`}
                            onClick={generatePartyCode}
                            disabled={!isPartyCodeValid}
                        >
                            Generate Party
                        </button>
                    </div>
                )}

                {!isPartyCodeValid && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            <p className="text-white bg-gray-800 px-4 py-2 rounded-md">
                                Party code: <span className="font-bold text-[#FF6B6B] text-xl">{selectedPartyCode}</span>
                            </p>
                            <CopyButton value={selectedPartyCode} />
                        </div>
                        <button 
                            className="generate-button"
                            onClick={() => dispatch(clearPartyCode())}
                        >
                            Reset
                        </button>
                        <RainbowButton text="Dashboard" href="/dashboard" />
                    </div>
                )}
            </div>
        </div>
    );
}