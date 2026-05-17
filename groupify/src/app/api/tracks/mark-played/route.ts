import { NextRequest, NextResponse } from 'next/server';
import { getDBConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get('session')?.value;
    const { spotify_id, playlist_id } = await request.json();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conn = await getDBConnection();

    try {
      // Mark track as played and queued
      await conn.query(
        `UPDATE tracks t 
         INNER JOIN playlist_tracks pt ON t.SpotifyID = pt.TrackID 
         SET t.played = TRUE, 
             t.played_at = NOW(),
             t.queued = TRUE,
             t.queue_at = NOW()
         WHERE t.SpotifyID = ? 
         AND pt.PlaylistID = ?`,
        [spotify_id, playlist_id]
      );

      return NextResponse.json({ success: true });
    } finally {
      await conn.release();
    }
  } catch (error) {
    console.error('Error marking track as played:', error);
    return NextResponse.json(
      { error: 'Failed to mark as played' },
      { status: 500 }
    );
  }
}
