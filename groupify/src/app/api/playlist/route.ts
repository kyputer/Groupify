import { NextRequest, NextResponse } from 'next/server';
import tracks from '@/db/tracks';

export async function POST(request: NextRequest) {
  try {
    const {Track, PlaylistID} = await request.json();
    const session = request.cookies.get('session')?.value;
    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    await tracks.addTrackToPlaylist(Track, PlaylistID, parseInt(session));
    return NextResponse.json({
        success: true,
        message: 'Track added to playlist',
    });
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
      { status: 500 }
    );
  }
}