import mariadb from 'mariadb';
import passport from 'passport';
import {getDBConnection, pool} from "../db/db.js";

// var Strategy = require('passport-local').Strategy;
import bcrypt from 'bcryptjs';

const users = {
    register,
    findById,
    strategy,
}

/// Creates a new user given a username and password
async function register(username, password, cb) {
    let hash = bcrypt.hashSync(password, 8);
    let conn;

    try {
        conn = await getDBConnection();
        await conn.query('INSERT INTO users (username, password_hash) VALUES (?,?);',
            [username, hash]);
                cb(null, {username: username});
    } catch (err) {
        console.error("Database error, user registration:", err);
        cb(err);
    } finally {
        if (conn) await conn.release();
    }
}

/// Implements a passbook strategy
/// This is used in app.js only as a `verify` function to resolve user credentials
var strategy = function(username, password, cb) {
    findByUsername(username, function(err, user) {
        if (err) return cb(err);
        if (user == null) return cb(null, null);
        if (bcrypt.compareSync(password, user["password_hash"])) return cb(null, user);
        return cb(null, false);
    });
}

/// Search for user by their id and then pass the user row object (json)
/// to the cb function. The user row has three keys: {"UserID":"", "Username", "Password"}
async function findById(id, cb) {
    let c;
    try {
        c = await getDBConnection();
        const rows = await c.query('SELECT * FROM users WHERE id = ?;', [id]);
        if (rows.length > 0) {
            cb(null, rows[0]);
        }else {
            cb(null, false);
        }
    } catch (err) {
        cb(err);
    } finally {
        if (c) await c.release();
    }
}

/// Search for user by their username and then pass the user row object (json)
/// to the cb function. The user row has three keys: {"UserID":"", "Username", "Password"}
async function findByUsername(username, cb) {
    let c;
    try{ 
        conn = await getDBConnection();
        const rows = await conn.query('SELECT * FROM user WHERE Username = ?;', [username]);
        if (rows.length > 0) {
            cb(null, rows[0]);
        }else {
            cb(null, null);
        }
    } catch (err) {
        cb(err);
    } finally {
        if (conn) await conn.release();
    }
}

// Define exports
// module.exports.register = register;
// module.exports.strategy = strategy;
// module.exports.findById = findById;
// module.exports.findByUsername = findByUsername;

export default users;
