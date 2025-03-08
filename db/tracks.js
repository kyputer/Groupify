import mariadb from 'mariadb';
import { getDBConnection } from './db.js';

const tracks = {
  upvote,
  downvote,
  pushBlacklist,
  getNext,
  getNew,
  getHot,
  getPlayed
};

async function upvote(track, userID) {
  console.log(`Upvoting track: ${track.id} by user: ${userID}`);
  let conn;
  try {
    conn = await getDBConnection();
    console.log('Database connection established');

    const rows = await conn.query('SELECT id FROM tracks WHERE SpotifyID=?;', [track.id]);
    console.log('Query executed:', rows);
    if (rows.length == 0) {
      await conn.query('INSERT INTO tracks (SpotifyID, title, artist, url, Votes) VALUES (?,?,?,?,?);', [track.id, track.name, track.artists[0].name, track.href, 1]);
      console.log('Track inserted');
    } else {
      const trackID = rows[0]["id"];
      const voterows = await conn.query('SELECT * FROM vote WHERE id=? AND UserID=?;', [trackID, userID]);
      console.log('Vote query executed:', voterows);
      if (voterows.length > 0) {
        console.log('User already voted for this track');
        return; // User already voted for this
      }
      await conn.query('INSERT INTO vote (id, UserID, Play) VALUES (?,?,?);', [trackID, userID, true]);
      await conn.query('UPDATE tracks SET Votes=Votes+1 WHERE id=?;', [trackID]);
      console.log('Track upvoted');
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

var downvote = async function (spotifyID, userID) {
console.log(`Downvoting track: ${spotifyID} by user: ${userID}`);
  let conn;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT id FROM tracks WHERE SpotifyID=?;', [spotifyID]);
    if (rows.length === 0) {
      return; // Don't downvote a record if one doesn't exist
    }
    const trackID = rows[0]["id"];
    const voterows = await conn.query('SELECT * FROM vote WHERE id=? AND UserID=?;', [trackID, userID]);
    if (voterows.length > 0) {
      return; // User already voted, exit
    }
    await conn.query('INSERT INTO vote (id, UserID, Play) VALUES (?,?,?);', [trackID, userID, false]);
    await conn.query('UPDATE track SET Votes=Votes-1 WHERE id=?;', [trackID]);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    if (conn) await conn.release();
  }
};

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

// Define exports
export default tracks;
