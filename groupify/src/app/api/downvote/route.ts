import { NextRequest, NextResponse } from 'next/server';
import tracks from '@/db/tracks';
import { getPlaylistID } from '@/db/playlists';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  try {
    const { SpotifyID, Code } = await request.json();
    const session = request.cookies.get('session')?.value;
    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if ( !SpotifyID) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const playlistID = await getPlaylistID(Code);
    if (!playlistID) {
      return NextResponse.json(
        { error: 'Invalid playlist code' },
        { status: 404 }
      );
    }

    // Create a track object with the minimum required properties
    const track = {
      id: SpotifyID,
      name: '',  // These will be filled in by the tracks.downvote function
      artists: [{ name: '' }],
      href: ''
    };

    const result = await tracks.downvote(track, parseInt(session), playlistID);
    console.log('Downvote result:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing downvote:', error);
    return NextResponse.json(
      { error: 'Failed to process downvote' },
      { status: 500 }
    );
  }
} 