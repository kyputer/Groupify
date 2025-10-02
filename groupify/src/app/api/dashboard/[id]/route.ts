import { NextResponse, NextRequest } from 'next/server';
import { Song } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';
import tracks from '@/db/tracks';
import { getPlaylistID } from '@/db/playlists';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = request.cookies.get('session')?.value;
    
    logger.log('Dashboard API called with id:', id);
    logger.log('Session:', session);
    
    if (!session) {
      logger.log('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return empty dashboard if no ID is provided
    if (!id) {
      logger.log('No ID provided');
      return NextResponse.json({
        PlayedJson: [] as Song[],
        HotJson: [] as Song[],
        HotVotes: [] as Vote[],
        UserID: session
      });
    }

    // The id parameter is now a code instead of the actual playlist ID
    const playlistID = await getPlaylistID(id);
    logger.log('Playlist ID from code:', playlistID);
    
    if (!playlistID) {
      logger.log(`No playlist found for code: ${id}`);
      return NextResponse.json({
        PlayedJson: [] as Song[],
        HotJson: [] as Song[],
        HotVotes: [] as Vote[],
        UserID: session
      });
    }

    logger.log("Fetching dashboard data for playlist code:", id);
    logger.log("Calling getHot with UserID:", session, "PlaylistID:", playlistID.toString());
    const hotSongs = await tracks.getHot(session, playlistID.toString());
    logger.log("Hot songs returned:", hotSongs);

    logger.log("Fetching played songs for playlist code:", id);
    const playedSongs = await tracks.getPlayed(session, playlistID.toString());
    logger.log("Played songs returned:", playedSongs);

    // Transform hot songs into the expected format
    const hotVotes = hotSongs.map(song => ({
      SongID: song.id,
      Votes: song.Votes || 0,
      Selected: song.Selected || null
    }));

    const data = {
      PlayedJson: playedSongs,
      HotJson: hotSongs,
      HotVotes: hotVotes,
      UserID: session
    };

    logger.log("Returning dashboard data:", data);
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
} 