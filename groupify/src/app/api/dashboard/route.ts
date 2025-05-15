import { NextResponse, NextRequest } from 'next/server';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import tracks from '@/db/tracks';
import { getPlaylistID } from '@/db/playlists';

export async function GET(
  request: NextRequest
) {
  try {

    const session = request.cookies.get('session')?.value;
    
    console.log('Session:', session);
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return empty dashboard if no ID is provided

      console.log('No ID provided');
      return NextResponse.json({
        PlayedJson: [] as Song[],
        HotJson: [] as Song[],
        HotVotes: [] as Vote[],
        UserID: session
      });
    

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 