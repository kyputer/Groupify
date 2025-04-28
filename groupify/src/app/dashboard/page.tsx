'use client'
import Dashboard from '@/components/Dashboard';
import { mockPlayedSongs, mockHotSongs, mockVotes } from '@/lib/mockData';

export default function Page() {
  const data = {
    PlayedJson: mockPlayedSongs,
    HotJson: mockHotSongs,
    HotVotes: mockVotes,
    UserID: '123',
    PartyCode: '12345678'
  };

  return (
    <div>
      <Dashboard 
        PlayedJson={data.PlayedJson}
        HotJson={data.HotJson}
        HotVotes={data.HotVotes}
        UserID={data.UserID}
        PartyCode={data.PartyCode}
      />
    </div>
  );
}