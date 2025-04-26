import { NextResponse } from 'next/server';
import { addTrackToPlaylist } from '@/db/tracks'; // Adjust the import path as needed

export async function POST(request: Request) {
  try {
    const { TrackID, PlaylistID } = await request.json();

    if (!TrackID || !PlaylistID) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await addTrackToPlaylist(PlaylistID, TrackID);

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
