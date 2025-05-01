'use client'
import Dashboard from '@/components/Dashboard';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { SongInterface } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';

export default function Page() {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.user.userId);
  const partyCode = useSelector((state: RootState) => state.party.partyCode);
  const [data, setData] = useState<{
    PlayedJson: SongInterface[];
    HotJson: SongInterface[];
    HotVotes: Vote[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

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
        UserID={userId || ''}
        PartyCode={partyCode || ''}
      />
    </div>
  );
}