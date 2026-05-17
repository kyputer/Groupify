'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPartyCode } from '@/lib/features/partySlice';

interface PageProps {
  setTabIndex?: (index: number) => void;
}

export default function JoinParty({ setTabIndex }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [party, setParty] = useState(['', '', '', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoJoinedPlaylistId = useRef<string | null>(null);
  const submittedCode = useRef<string | null>(null);
  const dispatch = useDispatch();

  const handleJoinPlaylistWithID = useCallback(async (playlistId: string) => {
    if (isJoining || autoJoinedPlaylistId.current === playlistId) {
      return;
    }

    autoJoinedPlaylistId.current = playlistId;
    setIsJoining(true);
    try {
      const response = await fetch(`/api/join-party/${playlistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        dispatch(
          setPartyCode({ code: result.partyCode, playlistID: playlistId })
        );
        setError('');
        if (setTabIndex) {
          setTabIndex(0);
        } else {
          router.push(`/dashboard?code=${result.partyCode}`);
        }
      } else {
        autoJoinedPlaylistId.current = null;
        setError(result.error);
      }
    } catch (err) {
      console.error('Error joining playlist:', err);
      autoJoinedPlaylistId.current = null;
      setError('Failed to join playlist');
    } finally {
      setIsJoining(false);
    }
  }, [dispatch, isJoining, router, setTabIndex]);

  useEffect(() => {
    const playlistId = searchParams?.get('playlistId');
    if (playlistId) {
      handleJoinPlaylistWithID(playlistId);
    }
  }, [searchParams, handleJoinPlaylistWithID]);

  const handleJoinParty = useCallback(async () => {
    console.log('handleJoinParty called');
    const code = party.join('');
    console.log('Party code:', code);
    if (code.length !== 8) {
      setError('Please enter a valid party code');
      return;
    }

    if (isJoining || submittedCode.current === code) {
      return;
    }

    submittedCode.current = code;
    setIsJoining(true);
    console.log('Attempting to join party with code:', code);
    try {
      const response = await fetch('/api/join-party', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ PartyCode: code }),
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        dispatch(
          setPartyCode({ code: code, playlistID: result.playlistID.toString() })
        );
        console.log('Party code set:', code);
        console.log('Playlist ID set:', result.playlistID);
        setError('');
        setParty(['', '', '', '', '', '', '', '']);
        if (setTabIndex) {
          setTabIndex(0);
        } else {
          router.push(`/dashboard?code=${code}`);
        }
      } else {
        submittedCode.current = null;
        setError(result.error);
      }
    } catch (err) {
      console.error('Error joining party:', err);
      submittedCode.current = null;
      setError('Failed to join party');
    } finally {
      setIsJoining(false);
    }
  }, [dispatch, isJoining, party, router, setTabIndex]);

  // Add effect to watch party state
  useEffect(() => {
    const isComplete = party.every(char => char !== '');
    console.log('Party state changed:', party, 'Is complete:', isComplete);
    if (isComplete) {
      console.log('All inputs filled, calling handleJoinParty');
      handleJoinParty();
    }
  }, [party, handleJoinParty]);

  const handleInputChange = (index: number, value: string) => {
    console.log('handleInputChange called with index:', index, 'value:', value);
    const newParty = [...party];
    newParty[index] = value;
    setParty(newParty);

    // Move to next input if current input is filled
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = async (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
      e.preventDefault();
      try {
        const pastedText = await navigator.clipboard.readText();
        console.log('Pasted text:', pastedText);
        const newParty = [...party];
        for (let i = 0; i < pastedText.length && i < 8; i++) {
          newParty[i] = pastedText.charAt(i);
        }
        setParty(newParty);
        if (pastedText.length < 8) {
          inputRefs.current[pastedText.length]?.focus();
        }
        return;
      } catch (err) {
        console.error('Failed to read clipboard:', err);
      }
    }

    switch (e.key) {
      case 'Backspace':
        if (!party[index] && index > 0) {
          // Move to previous input on backspace if current is empty
          inputRefs.current[index - 1]?.focus();
        }
        break;
      case 'ArrowLeft':
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
          e.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (index < 7) {
          inputRefs.current[index + 1]?.focus();
          e.preventDefault();
        }
        break;
      case 'Enter':
        e.preventDefault();
        console.log('Enter pressed, calling handleJoinParty');
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
    console.log('Pasted text:', text);
    const newParty = [...party];
    for (let i = 0; i < text.length && i < 8; i++) {
      newParty[i] = text.charAt(i);
    }
    setParty(newParty);
    if (text.length < 8) {
      inputRefs.current[text.length]?.focus();
    }
  };

  return (
    <div className='join-party-container'>
      <div className='join-party-content'>
        <h1 className='join-party-title'>Join the Party</h1>
        {isJoining ? (
          <p className='join-party-description'>Joining playlist...</p>
        ) : (
          <>
            <p className='join-party-description'>
              Enter the 8-character party code to join
            </p>
        {error && <p className='error-message'>{error}</p>}
        <div className='code-input-container'>
          {Array.from({ length: 8 }).map((_, index) => (
            <input
              key={index}
              ref={el => {
                inputRefs.current[index] = el;
              }}
              type='text'
              maxLength={1}
              value={party[index]}
              onChange={e => handleInputChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className='code-input'
            />
          ))}
        </div>
        <button className='join-button' onClick={handleJoinParty}>
          Join Party
        </button>
          </>
        )}
      </div>
    </div>
  );
}
