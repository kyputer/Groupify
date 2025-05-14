import { NextResponse } from 'next/server';
import { getPlaylists, createPlaylist } from '@/db/playlists';

export async function GET() {
  try {
    const playlists = await getPlaylists();
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, isPublic, code } = await request.json();

    // Simulate user authentication (replace with actual session/auth logic)
    const userId = request.cookies.get('session')?.value; // Ensure user is logged in
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const playlist = await createPlaylist(name, userId, isPublic, code);
    return NextResponse.json(playlist); // BigInt values are already converted to strings
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create playlist' },
      { status: 500 }
    );
  }
}