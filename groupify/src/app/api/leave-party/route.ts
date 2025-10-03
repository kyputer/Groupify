import { NextRequest, NextResponse } from 'next/server';
import playlists from '@/db/playlists';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const { PartyCode } = await request.json();
    const session = request.cookies.get('session')?.value;

    if (!session) {
      logger.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!PartyCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Leave the party
    await playlists.leavePlaylist(PartyCode, session);

    // Invalidate cache for this user since playlist membership changed
    const cacheKey = `playlists:${session}`;
    cache.delete(cacheKey);

    return NextResponse.json({
      success: true,
      message: 'Successfully left party',
      status: 200,
    });
  } catch (error) {
    logger.error('Error leaving party:', error);
    return NextResponse.json(
      { error: 'Failed to leave party' },
      { status: 500 }
    );
  }
}
