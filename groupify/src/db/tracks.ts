import { getDBConnection } from '@/lib/db';
import { Track } from '@/interfaces/Track';

const tracks = {
  upvote,
  downvote,
  pushBlacklist,
  getNext,
  getNew,
  getHot,
  getPlayed,
  createPlaylist,
  addTrackToPlaylist,
  getPlaylistVotes,
};

async function upvote(track: Track, userID: number, playlistID: number = 1): Promise<void> {
  console.log(`Upvoting track: ${track.id} by user: ${userID} in playlist: ${playlistID}`);
  let conn;
  try {
    conn = await getDBConnection();
    console.log('Database connection established');

    await conn.query(`
      INSERT IGNORE INTO playlists (PlaylistID, name, Description, user_id)
      VALUES (1, 'Default Playlist', 'This is the default playlist.', 1)
    `);

    const trackRows = await conn.query('SELECT id FROM tracks WHERE SpotifyID=?;', [track.id]);
    let trackID: number;
    if (trackRows.length === 0) {
      const result = await conn.query(
        'INSERT INTO tracks (SpotifyID, title, artist, url, user_id, votes) VALUES (?,?,?,?,?,?);',
        [track.id, track.name, track.artists[0].name, track.href, userID, 1]
      );
      trackID = result.insertId;
      console.log('Track inserted:', trackID);
    } else {
      trackID = trackRows[0].id;
    }

    await conn.query(
      'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PlaylistID=PlaylistID;',
      [playlistID, trackID]
    );

    const voteRows = await conn.query(
      'SELECT * FROM votes WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
      [trackID, userID, playlistID]
    );
    if (voteRows.length > 0) {
      if (voteRows[0].VoteType === 'upvote') {
        console.log('User already upvoted this track in this playlist');
        return;
      } else {
        await conn.query(
          'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
          ['upvote', trackID, userID, playlistID]
        );
        await conn.query('UPDATE tracks SET votes=votes+2 WHERE id=?;', [trackID]);
        console.log('Vote updated to upvote');
      }
    } else {
      await conn.query(
        'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
        [trackID, userID, 'upvote', playlistID]
      );
      await conn.query('UPDATE tracks SET votes=votes+1 WHERE id=?;', [trackID]);
      console.log('Vote inserted as upvote');
    }
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}
async function downvote(track: Track, userID: number, playlistID: number = 1): Promise<void> {
  console.log(`Downvoting track: ${track.id} by user: ${userID} in playlist: ${playlistID}`);
  let conn;
  try {
    conn = await getDBConnection();
    console.log('Database connection established');

    const trackRows = await conn.query('SELECT id FROM tracks WHERE SpotifyID=?;', [track.id]);
    let trackID: number;
    
    trackID = trackRows[0].id;
    

    await conn.query(
      'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PlaylistID=PlaylistID;',
      [playlistID, trackID]
    );

    const voteRows = await conn.query(
      'SELECT * FROM votes WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
      [trackID, userID, playlistID]
    );
    if (voteRows.length > 0) {
      if (voteRows[0].VoteType === 'downvote') {
        console.log('User already downvoted this track in this playlist');
        return;
      } else {
        await conn.query(
          'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
          ['downvote', trackID, userID, playlistID]
        );
        await conn.query('UPDATE tracks SET votes=votes-2 WHERE id=?;', [trackID]);
        console.log('Vote updated to downvote');
      }
    } else {
      await conn.query(
        'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
        [trackID, userID, 'downvote', playlistID]
      );
      await conn.query('UPDATE tracks SET votes=votes-1 WHERE id=?;', [trackID]);
      console.log('Vote inserted as downvote');
    }
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}

async function pushBlacklist(track: Track, playlistID: number): Promise<void> {
  console.log(`Pushing track: ${track.id} to blacklist for playlist: ${playlistID}`);
  let conn;
  try {
    conn = await getDBConnection();
    await conn.query(`UPDATE tracks SET blacklisted = 1  
      LEFT JOIN playlist_tracks ON tracks.id = playlist_tracks.TrackID 
      WHERE playlist_tracks.PlaylistID=?;`, 
      [playlistID]);
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}

async function createPlaylist(name: string, description: string, userID: number): Promise<void> {
  console.log(`Creating playlist: ${name} for user: ${userID}`);
  let conn;
  try {
    conn = await getDBConnection();
    await conn.query('INSERT INTO playlists (name, description, user_id) VALUES (?, ?, ?);', [name, description, userID]);
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}

async function addTrackToPlaylist(track: Track, playlistID: number): Promise<void> {
  console.log(`Adding track: ${track.id} to playlist: ${playlistID}`);
  let conn;
  try {
    conn = await getDBConnection();
    await conn.query('INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?);', [playlistID, track.id]);
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
}

async function getPlaylistVotes(playlistID: number): Promise<number> {
  console.log(`Getting votes for playlist: ${playlistID}`);
  let conn;
  let totalVotes: number = 0;
  try {
    conn = await getDBConnection();
    console.log('Database connection established');

    const voteRows = await conn.query(
      'SELECT SUM(votes) AS total_votes FROM tracks LEFT JOIN playlist_tracks ON tracks.id = playlist_tracks.TrackID WHERE playlist_tracks.PlaylistID=?;',
      [playlistID]
    );
    totalVotes = voteRows[0].total_votes;
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    if (conn) {
      try {
        await conn.release();
        console.log('Database connection released');
      } catch (releaseErr) {
        console.error('Error releasing database connection:', releaseErr);
      }
    }
  }
  return totalVotes;
}
    

// ...existing code for other functions with appropriate TypeScript annotations...

export default tracks;
