import { NextRequest, NextResponse } from 'next/server';
import playlists from '@/db/playlists';

export async function POST(request: NextRequest) {
  try {
    // Make sure to get all required fields from the request
    const { playlistCode, trackId, name, isPublic, description } = await request.json();
    const userId = request.cookies.get('session')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Validate required fields
    if (!playlistCode || !trackId || !name || !description || typeof isPublic === 'undefined') {
      return NextResponse.json({ error: 'Missing required playlist fields' }, { status: 400 });
    }

    // Add track and ensure playlist exists
    const result = await playlists.addTrackToPlaylist({
      playlistCode,
      trackId,
      name,
      createdBy: userId,
      isPublic,
      description
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return NextResponse.json({ error: 'Failed to add track to playlist' }, { status: 500 });
  }
}