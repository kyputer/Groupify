import { NextResponse } from 'next/server';
import tracks from '@/db/tracks';
import { getPlaylistID } from '@/db/playlists';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function POST(request: Request) {
  try {
    const { UserID, SpotifyID, Code } = await request.json();

    if (!UserID || !SpotifyID) {
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
      name: '',  // These will be filled in by the tracks.upvote function
      artists: [{ name: '' }],
      href: ''
    };

    const result = await tracks.upvote(track, parseInt(UserID), playlistID);
    console.log('Upvote result:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing upvote:', error);
    return NextResponse.json(
      { error: 'Failed to process upvote' },
      { status: 500 }
    );
  }
} 