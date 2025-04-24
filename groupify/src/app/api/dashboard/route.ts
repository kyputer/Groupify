import { NextResponse } from 'next/server';
import { SongInterface } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import { mockPlayedSongs, mockHotSongs, mockVotes } from '@/lib/mockData';

export async function GET() {
  try {
    const data = {
      PlayedJson: mockPlayedSongs,
      HotJson: mockHotSongs,
      HotVotes: mockVotes,
      UserID: '123'
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 