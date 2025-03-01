import mariadb from 'mariadb';
import {pool} from './db.js';
 

const tracks = {
	upvote,
	downvote,
	pushBlacklist,
	getNext,
	getNew,
	getHot,
	getPlayed
}

var upvote = async function (spotifyID, userID) {
    let c;
    try{
    c = await pool.getConnection();

    c.query('SELECT TrackID FROM track WHERE SpotifyID=?;',
            [spotifyID],
            function(err, rows){
                if (err){
                    c.end();
                    throw err;
                } if (rows.length == 0){ // Create new track record
                    c.query('INSERT INTO track (SpotifyID,Votes) VALUES (?,?);',
                            [spotifyID, 1]);
                    c.end();
                    // upvote(spotifyID, userID); // call the function again (overhaul this later)
                } else {
                    c.query('SELECT * FROM vote WHERE TrackID=? AND UserID=?;',
                            [rows[0]["TrackID"], userID],
                            function(err, voterows){
                                if (err){
                                    console.log(err);
                                    throw err;
                                } else if (voterows.length > 0) {
                                    c.end();
                                    return; // User already voted for this
                                }
                                // Create new vote record
                                c.query('INSERT INTO vote (TrackID, UserID, Play) VALUES (?,?,?);',
                                        [rows[0]["TrackID"], userID, true]);
                                // Increment the vote in the track record
                                c.query('UPDATE track SET Votes=Votes+1 WHERE TrackID=?;',
                                        [rows[0]["TrackID"]]);
                                c.end();
                            });
                }
            });
        } catch (err) {
            console.error("Database error:", err);
        } finally {
            if (c) await c.end()
        }
}

var downvote = async function (spotifyID, userID) {
    /*var c = mariadb.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();*/
    let c;
    try {
        c = await pool.getConnection();
        const rows = await c.query('SELECT TrackID FROM track WHERE SpotifyID=?;', [spotifyID]);
        if (rows.length === 0){
            await c.end(); 
            return; // Don't downvote a record if one doesn't exist
        }

        const trackID = rows[0]["TrackID"];

        // See if user has voted or not
        const voterows = await c.query('SELECT * FROM vote WHERE TrackID=? AND UserID=?;', [trackID, userID]);
        
        if (voterows.length > 0) {
            await c.end
            return
        } // User already voted, exit
        
        // Create new vote record
        await c.query('INSERT INTO vote (TrackID, UserID, Play) VALUES (?,?,?);', 
            [TrackID, userID, false]);
        
            // Increment the vote in the track record
        await c.query('UPDATE track SET Votes=Votes-1 WHERE TrackID=?;', 
            ["TrackID"]);
        } catch (err) {
            console.error("Database error:", err)
        } finally {
            if (c) await c.end();
        }
}


/// Push a TrackID to the front of the blacklist queue and take
/// the back item off the blacklist. Also, zero out the blacklisted song's votes.
var pushBlacklist = function(trackID){
    // var c = mariadb.createConnection({
    //   host     : '127.0.0.1',
    //   user     : process.env.USERNAME,
    //   password : process.env.PASSWORD,
    //   database : 'groupify'
    // });
    let c;
    c = pool.getConnection();

    console.log("Push " + trackID);
    // Increment all the blacklisted songs
    c.query('UPDATE track SET Blacklist=Blacklist+1 WHERE Blacklist IS NOT NULL;');
    // Insert the new song into the blacklist
    c.query('UPDATE track SET Blacklist=1 WHERE TrackID = ?;', [trackID]);
    // Remove blacklist songs 11 or greater
    c.query('UPDATE track SET Blacklist=NULL WHERE Blacklist=5;');
    // Close the connection
    c.end();
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
        c = await pool.getConnection();

    	c.query('SELECT * FROM track WHERE Blacklist IS NULL ORDER BY votes DESC;',
        	    function(err, rows){
                	if (err) throw err;
                	if (rows.length > index) return callback(rows[index]);
            	});

    	c.end();
    } catch (err) {
	console.error("Database error:", err);
	return null;
    } finally {
      if (c) c.end();
    }
}

var getHot = function(callback){
    var c = mariadb.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    
    c = pool.getConnection();



    c.query('SELECT * FROM track WHERE Blacklist IS NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.end();
}

var getNew = function(callback){
    var c = mariadb.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c = pool.getConnection();



    c.query('SELECT * FROM track WHERE Blacklist IS NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.end();
}

var getPlayed = function(callback){
    var c = mariadb.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c = pool.getConnection();



    c.query('SELECT * FROM track WHERE Blacklist IS NOT NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.end();
}



// Define exports
export default tracks;
