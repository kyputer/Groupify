'use client'
import Dashboard from '@/components/Dashboard';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import { useSearchParams } from 'next/navigation';
import { setPartyCode, setPlaylistID } from '@/lib/features/partySlice';

export default function Page() {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.user.userId);
  const playlistID = useSelector((state: RootState) => state.party.playlistID ?? '');
  const partyCode = useSelector((state: RootState) => state.party.selectedPartyCode);
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    PlayedJson: Song[];
    HotJson: Song[];
    HotVotes: Vote[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePartyJoin = async (newPartyCode: string, newPlaylistId: string) => {
    dispatch(setPartyCode(newPartyCode));
    dispatch(setPlaylistID(newPlaylistId));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Prioritize URL code over Redux state
        const code = searchParams?.get('code') || partyCode;

        if (!code) {
          setData({
            PlayedJson: [],
            HotJson: [],
            HotVotes: []
          });
          return;
        }

        const encodedCode = encodeURIComponent(code);
        const response = await fetch(`/api/dashboard/${encodedCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);

        // Update Redux state with the code from URL if it exists
        if (searchParams?.get('code')) {
          dispatch(setPartyCode(searchParams.get('code')!));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, partyCode, searchParams, dispatch]);

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div>
      <Dashboard 
        PlayedJson={data.PlayedJson}
        HotJson={data.HotJson}
        HotVotes={data.HotVotes}
        UserID={userId}
        PartyCode={searchParams?.get('code') || partyCode || ''}
        PlaylistID={playlistID}
        onPartyJoin={handlePartyJoin}
      />
    </div>
  );
}