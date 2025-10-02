import { NextRequest, NextResponse } from 'next/server';
import { getAllPublicPlaylists, createPlaylist, getUserPlaylists } from '@/db/playlists';
import { logger } from '@/lib/logger';
import { withCache, cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Create cache key that includes session to handle user-specific data
    const cacheKey = `playlists:${session || 'anonymous'}`;
    const ttl = 2 * 60 * 1000; // 2 minutes cache
    
    // If force refresh is requested, delete the cache first
    if (forceRefresh) {
      cache.delete(cacheKey);
    }
    
    const playlists = await withCache(cacheKey, ttl, async () => {
      logger.log("Getting all public playlists");
      const publicPlaylists = await getAllPublicPlaylists();
      
      if (session) {
        logger.log("Session value:", session);
        const userPlaylists = await getUserPlaylists(session);
        logger.log("User playlists:", userPlaylists);
        
        for (const playlist of userPlaylists) {
          const index = publicPlaylists.findIndex(p => p.id === playlist.id);
          if (index !== -1) {
            publicPlaylists[index].isJoined = true;
          } else {
            publicPlaylists.push(playlist);
          }
        }
      }
      
      publicPlaylists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return publicPlaylists;
    });
    
    return NextResponse.json(playlists);
  } catch (error) {
    logger.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, isPublic, description } = await request.json();

    // Simulate user authentication (replace with actual session/auth logic)
    const userId = request.cookies.get('session')?.value; // Ensure user is logged in
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
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