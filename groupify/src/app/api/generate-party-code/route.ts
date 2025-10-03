import { NextRequest, NextResponse } from 'next/server';
import playlists from '@/db/playlists';
import { sanitizeInput } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { isPublic, Name, Description } = await request.json();
    const session = request.cookies.get('session')?.value;

    if (!session) {
      logger.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sanitizedName = sanitizeInput(Name);
    const sanitizedDescription = sanitizeInput(Description);

    // Create playlist returns a playlist object with id and code
    const newPlaylist = await playlists.createPlaylist(
      sanitizedName,
      session,
      isPublic,
      sanitizedDescription
    );

    console.log('Created playlist:', newPlaylist);

    // Join the playlist using the playlist ID
    try {
      const playlistCode = await playlists.joinPlaylistWithID(
        newPlaylist.id.toString(),
        session
      );
      console.log('Successfully joined playlist with code:', playlistCode);
    } catch (joinError) {
      console.error('Error joining playlist:', joinError);
      // Even if join fails, we created the playlist successfully
    }

    return NextResponse.json({
      success: true,
      code: newPlaylist.code,
      playlistID: newPlaylist.id,
      message: 'Party code generated successfully',
    });
  } catch (error) {
    logger.error('Error in generating party code route:', error);
    return NextResponse.json(
      { error: 'Failed to generate party code' },
      { status: 500 }
    );
  }
}
