import { NextResponse, NextRequest } from 'next/server';
import playlists from '@/db/playlists';

export async function GET( request: NextRequest ) {
  const { searchParams } = new URL(request.url);
  const Code = searchParams.get('code');
    try {

    const session = request.cookies.get('session')?.value;
    
    console.log('Playlist owner API called');
    console.log('Session:', session);
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!Code) {
      return NextResponse.json(
            { error: 'No code provided' }, 
            { status: 400 }
        );
    }

    const playlistID = await playlists.getPlaylistID(Code);
    if (!playlistID) {
        return NextResponse.json(
            { error: 'No playlist found' }, 
            { status: 404 }
        );
    }
    const isOwner = await playlists.checkPlaylistOwner(session, playlistID.toString());
    console.log(`${session} is owner to ${playlistID}: ${isOwner}`);
    return NextResponse.json({ isOwner: isOwner });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 