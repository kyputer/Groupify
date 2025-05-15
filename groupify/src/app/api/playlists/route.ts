import { NextRequest, NextResponse } from 'next/server';
import { getAllPublicPlaylists, createPlaylist, getUserPlaylists } from '@/db/playlists';

export async function GET(request: NextRequest) {
  try {
    const playlists = await getAllPublicPlaylists();
    const session = request.cookies.get('session')?.value;
    if (session) {
      const userPlaylists = await getUserPlaylists(session);
      playlists.push(...userPlaylists);
    }
    playlists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, isPublic, code, description } = await request.json();

    // Simulate user authentication (replace with actual session/auth logic)
    const userId = request.cookies.get('session')?.value; // Ensure user is logged in
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const playlist = await createPlaylist(name, userId, isPublic, code, description);
    return NextResponse.json(playlist); // BigInt values are already converted to strings
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: `Failed to create playlist: ${error}` },
      { status: 500 }
    );
  }
}