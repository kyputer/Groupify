import { NextRequest, NextResponse } from 'next/server';
import playlists from '@/db/playlists';

export async function POST(request: NextRequest) {
  try {
    // Log the raw request body
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);

    // Parse the JSON body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      console.error('Failed to parse JSON body:', err);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Log the parsed body
    console.log('Parsed request body:', body);

    const { playlistCode, trackId, name, isPublic, description } = body;
    const userId = request.cookies.get('session')?.value;
    console.log('Session userId:', userId);

    // Log all fields
    console.log('playlistCode:', playlistCode);
    console.log('trackId:', trackId);
    console.log('name:', name);
    console.log('isPublic:', isPublic);
    console.log('description:', description);

    if (!userId) {
      console.warn('User not authenticated');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    /* Validate required fields - Currently missing:
     vars(in raw requests) - playlist name, code, description 
     check debugging logs.
     */
    if (!playlistCode || !trackId || !name || !description || typeof isPublic === 'undefined') {
      console.warn('Missing required playlist fields', {
        playlistCode, trackId, name, isPublic, description
      });
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