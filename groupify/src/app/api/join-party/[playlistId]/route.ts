import { NextResponse, NextRequest } from 'next/server';
import { joinPlaylistWithID } from '@/db/playlists';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
  try {
    const { playlistId } = await params;
    const session = request.cookies.get('session')?.value;

    logger.log('Join Party API called with id:', playlistId);
    logger.log('Session:', session);

    if (!session) {
      logger.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The id parameter is now a code instead of the actual playlist ID
    const partyCode = await joinPlaylistWithID(playlistId, session);
    logger.log('Joined party successfully with code:', partyCode);

    // Invalidate cache for this user since playlist membership changed
    const cacheKey = `playlists:${session}`;
    cache.delete(cacheKey);

    return NextResponse.json({
      success: true,
      message: 'Joined party successfully',
      partyCode: partyCode,
    });
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
