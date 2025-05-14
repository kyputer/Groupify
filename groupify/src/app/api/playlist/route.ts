import { NextResponse } from 'next/server';
import tracks from '@/db/tracks';

export async function POST(request: Request) {
  try {
    const {Track, PlaylistID, UserID} = await request.json();
    await tracks.addTrackToPlaylist(Track, PlaylistID, UserID);

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