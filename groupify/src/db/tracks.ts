import { getDBConnection } from '@/lib/db';
import { Track } from '@/interfaces/Track';
import { SpotifyTrack } from '@/interfaces/SpotifyTrack';

const tracks = {
  upvote,
  downvote,
  pushBlacklist,
  getNext,
  getNew,
  getHot,
  getPlayed,
  addTrackToPlaylist,
  getPlaylistVotes,
};

async function upvote(track: Track, userID: number, playlistID: number = 1): Promise<{ trackID: number; votes: number; voteType: string }> {
  console.log(`Upvoting track: ${track.id} by user: ${userID} in playlist: ${playlistID}`);
  let conn;
  try {
    conn = await getDBConnection();
    console.log('Database connection established');

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
    
    let voteType = 'upvote';
    if (voteRows.length > 0) {
      const currentVote = voteRows[0].VoteType;
      if (currentVote === 'upvote') {
        // If already upvoted, remove the vote (neutral)
        await conn.query(
          `UPDATE votes SET VoteType='neutral' WHERE TrackID=? AND UserID=? AND PlaylistID=?;`,
          [trackID, userID, playlistID]
        );
        await conn.query('UPDATE tracks SET votes=votes-1 WHERE id=?;', [trackID]);
        voteType = 'neutral';
        console.log('Vote removed (neutral)');
      } else if (currentVote === 'downvote') {
        // If downvoted, change to upvote
        await conn.query(
          'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
          ['upvote', trackID, userID, playlistID]
        );
        await conn.query('UPDATE tracks SET votes=votes+2 WHERE id=?;', [trackID]);
        console.log('Vote changed from downvote to upvote');
      } else if (currentVote === 'neutral') {
        // If neutral, change to upvote
        await conn.query(
          'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
          ['upvote', trackID, userID, playlistID]
        );
      }
    } else {
      // New upvote
      await conn.query(
        'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
        [trackID, userID, 'upvote', playlistID]
      );
      await conn.query('UPDATE tracks SET votes=votes+1 WHERE id=?;', [trackID]);
      console.log('New upvote added');
    }

    // Get the updated vote count
    const updatedTrack = await conn.query('SELECT votes FROM tracks WHERE id=?;', [trackID]);
    return { trackID, votes: updatedTrack[0].votes, voteType };
  } catch (err) {
    console.error('Database error:', err);
    throw err;
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

async function downvote(track: Track, userID: number, playlistID: number = 1): Promise<{ trackID: number; votes: number; voteType: string }> {
  console.log(`Downvoting track: ${track.id} by user: ${userID} in playlist: ${playlistID}`);
  let conn;
  try {
    conn = await getDBConnection();
    console.log('Database connection established');

    // First check if track exists
    const trackRows = await conn.query('SELECT id FROM tracks WHERE SpotifyID=?;', [track.id]);
    let trackID: number;
    
    if (trackRows.length === 0) {
      // If track doesn't exist, create it first
      const result = await conn.query(
        'INSERT INTO tracks (SpotifyID, title, artist, url, user_id, votes) VALUES (?,?,?,?,?,?);',
        [track.id, track.name, track.artists[0].name, track.href, userID, 0]
      );
      trackID = result.insertId;
      console.log('New track created for downvote:', trackID);
    } else {
      trackID = trackRows[0].id;
      console.log('Existing track found:', trackID);
    }

    // Ensure track is in playlist
    await conn.query(
      'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PlaylistID=PlaylistID;',
      [playlistID, trackID]
    );

    // Check existing vote
    const voteRows = await conn.query(
      'SELECT * FROM votes WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
      [trackID, userID, playlistID]
    );
    
    let voteType = 'downvote';
    if (voteRows.length > 0) {
      const currentVote = voteRows[0].VoteType;
      
      if (currentVote === 'downvote') {
        // If already downvoted, remove the vote (neutral)
        await conn.query(
          `UPDATE votes SET VoteType='neutral' WHERE TrackID=? AND UserID=? AND PlaylistID=?;`,
          [trackID, userID, playlistID]
        );
        await conn.query('UPDATE tracks SET votes=votes+1 WHERE id=?;', [trackID]);
        voteType = 'neutral';
        console.log('Vote removed (neutral)');
      } else if (currentVote === 'upvote') {
        // If upvoted, change to downvote
        await conn.query(
          'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
          ['downvote', trackID, userID, playlistID]
        );
        await conn.query('UPDATE tracks SET votes=votes-2 WHERE id=?;', [trackID]);
        console.log('Vote changed from upvote to downvote');
      } else if (currentVote === 'neutral') {
        // If neutral, change to downvote
        await conn.query(
          'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
          ['downvote', trackID, userID, playlistID]
        );
      }
    } else {
      // New downvote
      await conn.query(
        'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
        [trackID, userID, 'downvote', playlistID]
      );
      await conn.query('UPDATE tracks SET votes=votes-1 WHERE id=?;', [trackID]);
      console.log('New downvote added');
    }

    // Get the updated vote count
    const updatedTrack = await conn.query('SELECT votes FROM tracks WHERE id=?;', [trackID]);
    console.log('Updated vote count:', updatedTrack[0].votes);
    return { trackID, votes: updatedTrack[0].votes, voteType };
  } catch (err) {
    console.error('Database error in downvote:', err);
    throw err;
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
    await conn.query(`UPDATE tracks SET blacklist = 1  
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
async function getNext(): Promise<> {

}

async function getNew(): Promise<> {

}

async function getHot(UserID: string, PlaylistID: string): Promise<SpotifyTrack[]> {
  console.log('getHot called with UserID:', UserID, 'PlaylistID:', PlaylistID);
  const conn = await getDBConnection();
  try {
    console.log('Database connection established for getHot');
    
    const rows = await conn.query(`
      SELECT 
        DISTINCT t.SpotifyID,
        t.title,
        t.artist,
        t.url,
        t.image,
        t.votes,
        v.VoteType as Selected,
        v.UserID,
        COALESCE(SUM(CASE 
          WHEN v2.VoteType = 'upvote' THEN 1 
          WHEN v2.VoteType = 'downvote' THEN -1 
          ELSE 0 
        END), 0) as vote_count
      FROM tracks t 
       INNER JOIN playlist_tracks pt ON pt.TrackID = t.id
       INNER JOIN playlists p ON p.PlaylistID = pt.PlaylistID
       LEFT JOIN votes v ON v.TrackID = t.id AND v.UserID = ? AND v.PlaylistID = ?
       LEFT JOIN votes v2 ON v2.TrackID = t.id AND v2.PlaylistID = ?
      WHERE 
       p.PlaylistID = ?
      GROUP BY t.SpotifyID, t.title, t.artist, t.url, t.image, t.votes, v.VoteType, v.UserID
      ORDER BY vote_count DESC;`, [UserID, PlaylistID, PlaylistID, PlaylistID]);
    
    console.log('Raw query results:', rows);
    
    if (rows.length === 0) {
      console.log('No hot tracks found for playlist:', PlaylistID);
      return [];
    }
    
    const mappedTracks = rows.map((row: any) => ({
      id: row.SpotifyID,
      name: row.title,
      artists: [{ name: row.artist }],
      external_urls: { spotify: row.url },
      image: row.image,
      album: {
        images: [{ url: row.image }]
      },
      Votes: row.vote_count || 0,
      Selected: row.Selected || null
    }));

    console.log('Mapped tracks:', mappedTracks);
    return mappedTracks;
  } catch (err) {
    console.error('Error in getHot:', err);
    throw err;
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


async function getPlayed(): Promise<> {

}

async function addTrackToPlaylist(track: SpotifyTrack, playlistID: number, userID: number): Promise<void> {
  console.log(`Adding track: ${track.id} to playlist: ${playlistID}`);
  let conn;
  try {
    conn = await getDBConnection();
    
    // First check if track already exists
    const trackRows = await conn.query(
      'SELECT t.id FROM tracks t ' +
      'JOIN playlist_tracks pt ON t.id = pt.TrackID ' +
      'WHERE t.SpotifyID = ? AND pt.PlaylistID = ?;',
      [track.id, playlistID]
    );
    let trackID: number;
    
    if (trackRows.length === 0) {
      // Insert new track with initial vote count of 1
      const result = await conn.query(
        'INSERT INTO tracks (SpotifyID, title, artist, url, image, user_id, votes) VALUES (?,?,?,?,?,?,?);',
        [track.id, track.name, track.artists[0].name, track.external_urls.spotify, track.album.images[0].url, userID, 1]
      );
      trackID = result.insertId;
      console.log('New track inserted:', trackID);
    } else {
      trackID = trackRows[0].id;
      console.log('Existing track found:', trackID);
    }

    // Add track to playlist
    await conn.query(
      'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PlaylistID=PlaylistID;',
      [playlistID, trackID]
    );
    console.log(`Track ${trackID} added to playlist ${playlistID}`);

    // Check if user has already voted on this track
    const voteRows = await conn.query(
      'SELECT * FROM votes WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
      [trackID, userID, playlistID]
    );

    if (voteRows.length === 0) {
      // Add initial upvote for the user who added the track
      await conn.query(
        'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
        [trackID, userID, 'upvote', playlistID]
      );
      await conn.query('UPDATE tracks SET votes=votes+1 WHERE id=?;', [trackID]);
      console.log('Initial upvote added for track');
    } else {
      console.log('User has already voted on this track');
    }
  } catch (err) {
    console.error('Database error:', err);
    throw err;
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
