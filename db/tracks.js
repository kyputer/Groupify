import mariadb from 'mariadb';
import { pool, getDBConnection } from './db.js';

const tracks = {
  upvote,
  downvote,
  pushBlacklist,
  getNext,
  getNew,
  getHot,
  getPlayed
};

var upvote = async function (spotifyID, userID) {
  let conn;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT TrackID FROM track WHERE SpotifyID=?;', [spotifyID]);
    if (rows.length == 0) {
      await conn.query('INSERT INTO track (SpotifyID, Votes) VALUES (?,?);', [spotifyID, 1]);
    } else {
      const trackID = rows[0]["TrackID"];
      const voterows = await conn.query('SELECT * FROM vote WHERE TrackID=? AND UserID=?;', [trackID, userID]);
      if (voterows.length > 0) {
        return; // User already voted for this
      }
      await conn.query('INSERT INTO vote (TrackID, UserID, Play) VALUES (?,?,?);', [trackID, userID, true]);
      await conn.query('UPDATE track SET Votes=Votes+1 WHERE TrackID=?;', [trackID]);
    }
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    if (conn) await conn.release();
  }
};

var downvote = async function (spotifyID, userID) {
  let conn;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT TrackID FROM track WHERE SpotifyID=?;', [spotifyID]);
    if (rows.length === 0) {
      return; // Don't downvote a record if one doesn't exist
    }
    const trackID = rows[0]["TrackID"];
    const voterows = await conn.query('SELECT * FROM vote WHERE TrackID=? AND UserID=?;', [trackID, userID]);
    if (voterows.length > 0) {
      return; // User already voted, exit
    }
    await conn.query('INSERT INTO vote (TrackID, UserID, Play) VALUES (?,?,?);', [trackID, userID, false]);
    await conn.query('UPDATE track SET Votes=Votes-1 WHERE TrackID=?;', [trackID]);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    if (conn) await conn.release();
  }
};

var pushBlacklist = function(trackID){
    // var c = mariadb.createConnection({
    //   host     : '127.0.0.1',
    //   user     : process.env.USERNAME,
    //   password : process.env.PASSWORD,
    //   database : 'groupify'
    // });
    let c;
    c = getDBConnection();

    console.log("Push " + trackID);
    // Increment all the blacklisted songs
    c.query('UPDATE track SET blacklist=blacklist+1 WHERE blacklist IS NOT NULL;');
    // Insert the new song into the blacklist
    c.query('UPDATE track SET blacklist=1 WHERE TrackID = ?;', [trackID]);
    // Remove blacklist songs 11 or greater
    c.query('UPDATE track SET blacklist=NULL WHERE blacklist=5;');
    // Close the connection
    c.release();
}

/// passes string argument spotifyID to callback function
async function getNext(index, callback) {
   /* var c = mariadb.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });*/
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

var getNew = function(callback){
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

var getPlayed = function(callback){
    var c = mariadb.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c = getDBConnection();



    c.query('SELECT * FROM tracks WHERE blacklist IS NOT NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.release();
}



// Define exports
export default tracks;
