import { NextResponse, NextRequest } from 'next/server';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import tracks from '@/db/tracks';
import { getPlaylistID, joinPlaylistWithID } from '@/db/playlists';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = request.cookies.get('session')?.value;
    
    console.log('Join Party API API called with id:', id);
    console.log('Session:', session);
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return empty dashboard if no ID is provided
    if (!id) {
      console.log('No ID provided');
      return NextResponse.json({
        PlayedJson: [] as Song[],
        HotJson: [] as Song[],
        HotVotes: [] as Vote[],
        UserID: session
      });
    }

    // The id parameter is now a code instead of the actual playlist ID

    const partyCode = await joinPlaylistWithID(id, session)

    return NextResponse.json({
        success: true,
        message: "Joined party successfully",
        partyCode: partyCode
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 