'use client'
import Dashboard from '@/components/Dashboard';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import { useSearchParams } from 'next/navigation';

export default function Page() {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get party code from URL if not in Redux store
        const code = partyCode || searchParams?.get('code');
        console.log('Party code from store:', partyCode);
        console.log('Party code from URL:', searchParams?.get('code'));
        console.log('Selected code:', code);

        if (!code) {
          throw new Error('No party code provided');
        }

        const encodedCode = encodeURIComponent(code);
        console.log('Fetching dashboard data for code:', code);
        const response = await fetch(`/api/dashboard/${encodedCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies in the request
        });

        console.log('Dashboard API response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Dashboard API error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        console.log('Dashboard data received:', dashboardData);
        setData(dashboardData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      }
    };

    if (userId) {
      console.log('User ID found, fetching data...');
      fetchData();
    } else {
      console.log('No user ID found, skipping data fetch');
    }
  }, [userId, partyCode, searchParams]);

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
        PartyCode={partyCode || searchParams?.get('code') || ''}
        PlaylistID={playlistID}
      />
    </div>
  );
}