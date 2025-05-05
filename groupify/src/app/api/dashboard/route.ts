import { NextResponse } from 'next/server';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';

export async function GET() {
  try {
    // TODO: Replace with actual data fetching logic
    const data = {
      PlayedJson: [] as Song[],
      HotJson: [] as Song[],
      HotVotes: [] as Vote[],
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