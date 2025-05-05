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

    if (isDevelopment) {
      // In development, just return success
      return NextResponse.json({ 
        success: true,
        message: 'Mock downvote successful'
      });
    }


  const playlistID = await getPlaylistID(Code);
  // In production, send vote to the backend
  await tracks.downvote(SpotifyID, UserID, playlistID);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing downvote:', error);
    return NextResponse.json(
      { error: 'Failed to process downvote' },
      { status: 500 }
    );
  }
} 