import { NextResponse } from 'next/server';
import tracks from '@/db/tracks';

export async function POST(request: Request) {
  try {
    const { TrackID, PlaylistID } = await request.json();

    if (!TrackID || !PlaylistID) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await tracks.addTrackToPlaylist(TrackID, PlaylistID);

    return NextResponse.json({
      success: true,
      message: `Track ${TrackID} added to playlist ${PlaylistID}`,
    });
  } catch (error) {
    console.error('Error in addTrackToPlaylist route:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
      { status: 500 }
    );
  }
}
