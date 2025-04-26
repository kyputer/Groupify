import mariadb from 'mariadb';
import { getDBConnection } from './db.js';

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
  getPlaylistVotes
};

async function upvote(track, userID, playlistID = 1) {
    console.log(`Upvoting track: ${track.id} by user: ${userID} in playlist: ${playlistID}`);
    let conn;
    try {
        conn = await getDBConnection();
        console.log('Database connection established');

        // Ensure the default playlist exists
        await conn.query(`
            INSERT IGNORE INTO playlists (PlaylistID, name, Description, user_id)
            VALUES (1, 'Default Playlist', 'This is the default playlist.', 1)
        `);

        // Check if the track exists
        const trackRows = await conn.query('SELECT id FROM tracks WHERE SpotifyID=?;', [track.id]);
        let trackID;
        if (trackRows.length === 0) {
            // Insert the track if it doesn't exist
            const result = await conn.query(
                'INSERT INTO tracks (SpotifyID, title, artist, url, user_id, votes) VALUES (?,?,?,?,?,?);',
                [track.id, track.name, track.artists[0].name, track.href, userID, 1]
            );
            trackID = result.insertId;
            console.log('Track inserted:', trackID);
        } else {
            trackID = trackRows[0].id;
        }

        // Ensure the track is associated with the playlist
        await conn.query(
            'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PlaylistID=PlaylistID;',
            [playlistID, trackID]
        );

        // Check if the user has already voted for this track in the playlist
        const voteRows = await conn.query(
            'SELECT * FROM votes WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
            [trackID, userID, playlistID]
        );
        if (voteRows.length > 0) {
            if (voteRows[0].VoteType === 'upvote') {
                console.log('User already upvoted this track in this playlist');
                return; // User already upvoted this track in this playlist
            } else {
                // Update the vote to upvote
                await conn.query(
                    'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
                    ['upvote', trackID, userID, playlistID]
                );
                await conn.query('UPDATE tracks SET votes=votes+2 WHERE id=?;', [trackID]);
                console.log('Vote updated to upvote');
            }
        } else {
            // Insert a new vote
            await conn.query(
                'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
                [trackID, userID, 'upvote', playlistID]
            );
            await conn.query('UPDATE tracks SET votes=votes+1 WHERE id=?;', [trackID]);
            console.log('Vote inserted as upvote');
        }
    } catch (err) {
        console.error("Database error:", err);
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

async function downvote(SpotifyID, userID, playlistID = 1) {
    console.log(`Downvoting track: ${SpotifyID} by user: ${userID} in playlist: ${playlistID}`);
    let conn;
    try {
        conn = await getDBConnection();
        console.log('Database connection established');

        // Fetch the track details using SpotifyID
        const trackRows = await conn.query('SELECT id FROM tracks WHERE SpotifyID=?;', [SpotifyID]);
        if (trackRows.length === 0) {
            console.log('Track not found');
            return; // Don't downvote a record if one doesn't exist
        }
        const trackID = trackRows[0].id;

        // Ensure the track is associated with the playlist
        await conn.query(
            'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?) ON DUPLICATE KEY UPDATE PlaylistID=PlaylistID;',
            [playlistID, trackID]
        );

        // Check if the user has already voted for this track in the playlist
        const voteRows = await conn.query(
            'SELECT * FROM votes WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
            [trackID, userID, playlistID]
        );
        if (voteRows.length > 0) {
            if (voteRows[0].VoteType === 'downvote') {
                console.log('User already downvoted this track in this playlist');
                return; // User already downvoted this track in this playlist
            } else {
                // Update the vote to downvote
                await conn.query(
                    'UPDATE votes SET VoteType=? WHERE TrackID=? AND UserID=? AND PlaylistID=?;',
                    ['downvote', trackID, userID, playlistID]
                );
                await conn.query('UPDATE tracks SET votes=votes-2 WHERE id=?;', [trackID]);
                console.log('Vote updated to downvote');
            }
        } else {
            // Insert a new vote
            await conn.query(
                'INSERT INTO votes (TrackID, UserID, VoteType, PlaylistID) VALUES (?,?,?,?);',
                [trackID, userID, 'downvote', playlistID]
            );
            await conn.query('UPDATE tracks SET votes=votes-1 WHERE id=?;', [trackID]);
            console.log('Vote inserted as downvote');
        }
    } catch (err) {
        console.error("Database error:", err);
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

var pushBlacklist = async function(trackID) {
  console.log(`Pushing track to blacklist: ${trackID}`);
    let c;
    c = getDBConnection();

    console.log("Push " + trackID);
    // Increment all the blacklisted songs
    c.query('UPDATE track SET blacklist=blacklist+1 WHERE blacklist IS NOT NULL;');
    // Insert the new song into the blacklist
    c.query('UPDATE track SET blacklist=1 WHERE id = ?;', [trackID]);
    // Remove blacklist songs 11 or greater
    c.query('UPDATE track SET blacklist=NULL WHERE blacklist=5;');
    // Close the connection
    c.release();
}

/// passes string argument spotifyID to callback function
async function getNext(index, callback) {
   console.log(`Getting next track at index: ${index}`);
    let c;
    try {
        c = await getDBConnection();

    	await c.query('SELECT * FROM tracks WHERE blacklist IS NULL ORDER BY votes DESC;',
        	    function(err, rows){
                	if (err) throw err;
                	if (rows.length > index) return callback(rows[index]);
            	});

    	c.release();
    } catch (err) {
	    console.error("Database error:", err);
	    return null;
    } finally {
      if (c) await c.release();
    }
}

async function getHot(callback) {
console.log('Retrieving hot tracks');
  let conn;
  try {
    console.log('Retrieving hot tracks');
    conn = await getDBConnection();
    const rows = await conn.query('SELECT * FROM tracks WHERE blacklist IS NULL ORDER BY votes DESC;');
    console.log('Hot tracks query executed:', rows);
    callback(rows);
  } catch (err) {
    console.error("Database error:", err);
    callback([]);
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

var getNew = async function(callback) {
  console.log('Retrieving new tracks');
    var c = mariadb.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c = getDBConnection();

    c.query('SELECT * FROM tracks WHERE blacklist IS NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.release();
}

async function getPlayed(callback) {
  console.log('Retrieving played tracks');
  let conn;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT * FROM tracks WHERE blacklist IS NOT NULL ORDER BY Votes DESC;');
    console.log('Played tracks query executed:', rows);
    callback(rows);
  } catch (err) {
    console.error("Database error:", err);
    callback([]);
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

// Create a new playlist
async function createPlaylist(name, description) {
    const conn = await getDBConnection();
    try {
        const result = await conn.query(
            'INSERT INTO playlists (Name, Description) VALUES (?, ?)',
            [name, description]
        );
        console.log('Playlist created:', result.insertId);
        return result.insertId;
    } finally {
        conn.release();
    }
}

// Add a track to a playlist
async function addTrackToPlaylist(playlistID, trackID) {
    const conn = await getDBConnection();
    try {
        await conn.query(
            'INSERT INTO playlist_tracks (PlaylistID, TrackID) VALUES (?, ?)',
            [playlistID, trackID]
        );
        console.log(`Track ${trackID} added to playlist ${playlistID}`);
    } finally {
        conn.release();
    }
}

// Get votes for a specific playlist
async function getPlaylistVotes(playlistID, callback) {
    const conn = await getDBConnection();
    try {
        const rows = await conn.query(
            'SELECT v.*, t.* FROM votes v JOIN tracks t ON v.TrackID = t.id WHERE v.PlaylistID = ?',
            [playlistID]
        );
        console.log('Playlist votes retrieved:', rows);
        callback(rows);
    } finally {
        conn.release();
    }
}

// Define exports
export default tracks;
