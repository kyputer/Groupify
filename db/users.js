import mariadb from 'mariadb';
import passport from 'passport';
import {pool} from "../db/db.js";

// var Strategy = require('passport-local').Strategy;
import bcrypt from 'bcryptjs';

const users = {
    register,
    findById,
    strategy,
}

/// Creates a new user given a username and password
var register = function(username, password, cb) {
    var hash = bcrypt.hashSync(password, 8);

    var c = pool.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('INSERT INTO user (Username, Password) VALUES (?,?);',
        [username, hash],
        function(err, user){
            if (err) cb(err);
            cb(null, user);
        });

    c.release();
}

/// Implements a passbook strategy
/// This is used in app.js only as a `verify` function to resolve user credentials
var strategy = function(username, password, cb) {
    findByUsername(username, function(err, user) {
        if (err) return cb(err);
        if (user == null) return cb(null, null);
        if (bcrypt.compareSync(password, user["Password"])) return cb(null, user);
        return cb(null, false);
    });
}

/// Search for user by their id and then pass the user row object (json)
/// to the cb function. The user row has three keys: {"UserID":"", "Username", "Password"}
var findById = function(id, cb) {
    var c = pool.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('SELECT * FROM user WHERE UserID = ?;',
        [username],
        function(err, rows){
            if (err || rows.length==0)
                return cb(new Error('User ' + id + ' does not exist'));
            else
                return cb(null, rows[0]);
        });

    c.release();
}

/// Search for user by their username and then pass the user row object (json)
/// to the cb function. The user row has three keys: {"UserID":"", "Username", "Password"}
var findByUsername = function(username, cb) {
    var c = pool.createConnection({
      host     : '127.0.0.1',
      user     : process.env.USERNAME,
      password : process.env.PASSWORD,
      database : 'groupify'
    });
    c.connect();

    c.query('SELECT * FROM user WHERE Username = ?;',
            [username],
            function(err, rows){
                if (err || rows.length==0)
                    return cb(null, null);
                else
                    return cb(null, rows[0]);
            });

    c.release();
}

// Define exports
// module.exports.register = register;
// module.exports.strategy = strategy;
// module.exports.findById = findById;
// module.exports.findByUsername = findByUsername;

export default users;
