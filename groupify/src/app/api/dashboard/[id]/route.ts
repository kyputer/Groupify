import { NextResponse, NextRequest } from 'next/server';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import { getPlaylistID } from '@/db/playlists';
import { logger } from '@/lib/logger';
import { executeQuery } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = request.cookies.get('session')?.value;

    logger.log('Dashboard API called with id:', id);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({
        PlayedJson: [] as Song[],
        HotJson: [] as Song[],
        HotVotes: [] as Vote[],
        UserID: session,
      });
    }

    const playlistID = await getPlaylistID(id);
    if (!playlistID) {
      return NextResponse.json({
        PlayedJson: [] as Song[],
        HotJson: [] as Song[],
        HotVotes: [] as Vote[],
        UserID: session,
      });
    }

    // Use executeQuery for automatic connection management
    const allTracks = await executeQuery<any>(
      `
      (
        SELECT DISTINCT
          'hot' as track_type,
          t.SpotifyID,
          t.title,
          t.artist,
          t.url,
          t.image,
          t.votes,
          t.duration_ms,
          t.explicit,
          v.VoteType as Selected,
          u.username as added_by_username,
          u.id as added_by_id,
          COALESCE(SUM(CASE 
            WHEN v2.VoteType = 'upvote' THEN 1 
            WHEN v2.VoteType = 'downvote' THEN -1 
            ELSE 0 
          END), 0) as vote_count
        FROM tracks t 
         INNER JOIN playlist_tracks pt ON pt.TrackID = t.SpotifyID
         LEFT JOIN users u ON u.id = t.user_id
         LEFT JOIN votes v ON v.TrackID = t.SpotifyID AND v.UserID = ? AND v.PlaylistID = ?
         LEFT JOIN votes v2 ON v2.TrackID = t.SpotifyID AND v2.PlaylistID = ?
        WHERE 
         pt.PlaylistID = ?
         AND (t.queue_at IS NULL OR t.queued = 0)
         AND (t.blacklist = 0 OR t.blacklist IS NULL)
        GROUP BY t.SpotifyID, t.title, t.artist, t.url, t.image, t.votes, t.duration_ms, t.explicit, v.VoteType, u.username, u.id
        ORDER BY vote_count DESC
      )
      UNION ALL
      (
        SELECT 
          'played' as track_type,
          t.SpotifyID,
          t.title,
          t.artist,
          t.url,
          t.image,
          t.votes,
          t.duration_ms,
          t.explicit,
          NULL as Selected,
          u.username as added_by_username,
          u.id as added_by_id,
          0 as vote_count
        FROM tracks t 
         INNER JOIN playlist_tracks pt ON pt.TrackID = t.SpotifyID
         LEFT JOIN users u ON u.id = t.user_id
        WHERE 
         pt.PlaylistID = ?
         AND t.queue_at IS NOT NULL
         AND t.queued = 1
        ORDER BY t.queue_at ASC
      )
    `,
      [session, playlistID, playlistID, playlistID, playlistID]
    );

    // Separate hot and played tracks
    const hotTracks = allTracks.filter((row: any) => row.track_type === 'hot');
    const playedTracks = allTracks.filter((row: any) => row.track_type === 'played');

    // Transform to expected format with user info
    const hotSongs = hotTracks.map((row: any) => ({
      id: row.SpotifyID,
      name: row.title,
      artists: [{ name: row.artist }],
      external_urls: { spotify: row.url },
      image: row.image,
      album: {
        id: row.SpotifyID,
        name: row.title,
        images: [{ url: row.image }],
      },
      duration_ms: row.duration_ms,
      explicit: row.explicit,
      preview_url: null,
      popularity: 0,
      Votes: row.vote_count || 0,
      Selected: row.Selected || null,
      addedBy: {
        id: row.added_by_id,
        username: row.added_by_username || 'Unknown',
      },
    }));

    const playedSongs = playedTracks.map((row: any) => ({
      id: row.SpotifyID,
      name: row.title,
      artists: [{ name: row.artist }],
      external_urls: { spotify: row.url },
      image: row.image,
      album: {
        id: row.SpotifyID,
        name: row.title,
        images: [{ url: row.image }],
      },
      duration_ms: row.duration_ms,
      explicit: row.explicit,
      preview_url: null,
      popularity: 0,
      Votes: 0,
      Selected: null,
      addedBy: {
        id: row.added_by_id,
        username: row.added_by_username || 'Unknown',
      },
    }));

    const hotVotes = hotSongs.map((song: Song) => ({
      SongID: song.id,
      Votes: song.Votes || 0,
      Selected: song.Selected || null,
    }));

    const data = {
      PlayedJson: playedSongs,
      HotJson: hotSongs,
      HotVotes: hotVotes,
      UserID: session,
    };

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
