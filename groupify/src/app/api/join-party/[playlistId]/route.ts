import { NextResponse, NextRequest } from 'next/server';
import { joinPlaylistWithID } from '@/db/playlists';

export async function POST(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const { playlistId } = await params;
    const session = request.cookies.get('session')?.value;
    
    console.log('Join Party API called with id:', playlistId);
    console.log('Session:', session);
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // The id parameter is now a code instead of the actual playlist ID
    const partyCode = await joinPlaylistWithID(playlistId, session)
    console.log('Joined party successfully with code:', partyCode);
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