import { NextResponse } from 'next/server';
import tracks from '@/db/tracks';

export async function POST(request: Request) {
  try {
    const { TrackID, PlaylistID } = await request.json();

    // Get userId from session cookie
    const cookies = request.headers.get('cookie');
    let userId: string | null = null;
    if (cookies) {
      const sessionCookie = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
      userId = sessionCookie ? sessionCookie.split('=')[1] : null;
    }

    if (!TrackID || !PlaylistID || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await tracks.addTrackToPlaylist(TrackID, PlaylistID, Number(userId));

    return NextResponse.json({
      success: true,
      message: `Track ${TrackID} added to playlist ${PlaylistID} by user ${userId}`,
    });
  } catch (error) {
    console.error('Error in addTrackToPlaylist route:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
      { status: 500 }
    );
  }
}
