var mysql = require('mysql');


var upvote = function (spotifyID, userID) {
    var c = mysql.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

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
}

var downvote = function (spotifyID, userID) {
    var c = mysql.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('SELECT TrackID FROM track WHERE SpotifyID=?;',
            [spotifyID],
            function(err, rows){
                if (err){
                    c.end();
                    throw err;
                } if (rows.length == 0){ // Don't downvote a record if one doesn't exist
                    c.end();
                    return;
                } else {
                    c.query('SELECT * FROM vote WHERE TrackID=? AND UserID=?;',
                            [rows[0]["TrackID"], userID],
                            function(err, rows){
                                if (err){
                                    c.end();
                                    throw err;
                                } else if (rows.length == 0) {
                                    c.end();
                                    return; // User already voted for this
                                }
                                // Create new vote record
                                c.query('INSERT INTO vote (TrackID, UserID, Play) VALUES (?,?,?);',
                                        [rows[0]["TrackID"], userID, false]);
                                // Increment the vote in the track record
                                c.query('UPDATE track SET Votes=Votes-1 WHERE TrackID=?;',
                                        [rows[0]["TrackID"]]);
                                c.end();
                            });
                }
            });
}

/// Push a TrackID to the front of the blacklist queue and take
/// the back item off the blacklist. Also, zero out the blacklisted song's votes.
var pushBlacklist = function(trackID){
    var c = mysql.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();
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
var getNext = function (index, callback) {
    var c = mysql.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('SELECT * FROM track WHERE Blacklist IS NULL ORDER BY votes DESC;',
            function(err, rows){
                if (err) throw err;
                if (rows.length > index) return callback(rows[index]);
            });

    c.end();
}

var getHot = function(callback){
    var c = mysql.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('SELECT * FROM track WHERE Blacklist IS NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.end();
}

var getNew = function(callback){
    var c = mysql.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('SELECT * FROM track WHERE Blacklist IS NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.end();
}

var getPlayed = function(callback){
    var c = mysql.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('SELECT * FROM track WHERE Blacklist IS NOT NULL ORDER BY Votes DESC;',
            function(err, rows){
                if (err) throw err;
                return callback(rows);
            });

    c.end();
}



// Define exports
module.exports.pushBlacklist = pushBlacklist;
module.exports.upvote = upvote;
module.exports.downvote = downvote;
module.exports.getNext = getNext;
module.exports.getHot = getHot;
module.exports.getPlayed = getPlayed;
module.exports.getNew = getNew;
