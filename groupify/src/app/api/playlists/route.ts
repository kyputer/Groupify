import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPublicPlaylists,
  createPlaylist,
  getUserPlaylists,
} from '@/db/playlists';
import { logger } from '@/lib/logger';
import { withCache, cache } from '@/lib/cache';
import { getDBConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh') === 'true';

    logger.log('Getting all public playlists, refresh:', refresh);

    if (!session) {
      logger.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cacheKey = `playlists:${session}`;

    // Force cache invalidation if refresh is requested
    if (refresh) {
      cache.delete(cacheKey);
      logger.log('Cache manually refreshed for user:', session);
    }

    // Check if this is a fresh request after reset by checking if any playlists exist at all
    let conn;
    try {
      conn = await getDBConnection();
      const playlistCount = await conn.query(
        'SELECT COUNT(*) as count FROM playlists WHERE open = 1'
      );

      if (playlistCount[0].count === 0) {
        // Database is empty, clear cache and return empty array
        cache.delete(cacheKey);
        logger.log('Database is empty after reset, returning empty playlists');
        return NextResponse.json([]);
      }
    } finally {
      if (conn) await conn.release();
    }

    // Try cache first (unless refresh was requested)
    if (!refresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.log('Returning cached playlists');
        return NextResponse.json(cached);
      }
    }

    logger.log('Session value:', session);
    const userPlaylists = await getUserPlaylists(session);
    const publicPlaylists = await getAllPublicPlaylists();

    // Combine and deduplicate
    const allPlaylists = [...userPlaylists];
    publicPlaylists.forEach(playlist => {
      if (!allPlaylists.some(p => p.id === playlist.id)) {
        allPlaylists.push(playlist);
      }
    });

    logger.log('Found playlists:', allPlaylists.length);
    logger.log('User playlists:', userPlaylists);

    // Cache the result
    cache.set(cacheKey, allPlaylists, 300); // 5 minutes

    return NextResponse.json(allPlaylists);
  } catch (error) {
    logger.error('Error fetching playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, isPublic, description } = await request.json();

    // Simulate user authentication (replace with actual session/auth logic)
    const userId = request.cookies.get('session')?.value; // Ensure user is logged in
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const playlist = await createPlaylist(name, userId, isPublic, description);

    // Invalidate cache for all users since a new public playlist was created
    const cachePattern = 'playlists:';
    const stats = cache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(cachePattern)) {
        cache.delete(key);
      }
    });

    return NextResponse.json(playlist); // BigInt values are already converted to strings
  } catch (error) {
    logger.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: `Failed to create playlist: ${error}` },
      { status: 500 }
    );
  }
}
