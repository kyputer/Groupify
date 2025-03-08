import mariadb from 'mariadb';
import passport from 'passport';
import { getDBConnection, pool } from "../db/db.js";

// var Strategy = require('passport-local').Strategy;
import bcrypt from 'bcryptjs';

const users = {
    register,
    findById,
    strategy,
    findByUsername
}

/// Creates a new user given a username and password
async function register(email, username, password, cb) {
    let hash = bcrypt.hashSync(password, 8);
    let conn;

    try {
        conn = await getDBConnection();
        await conn.query('INSERT INTO users (email, username, password_hash) VALUES (?,?,?);', [email, username, hash]);
        cb({ email: email }, { username: username });
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
async function findById(id) {
    let conn;
    try {
        console.log(`Finding user by ID: ${id}`);
        conn = await getDBConnection();
        console.log('Database connection established');
        const rows = await conn.query('SELECT * FROM users WHERE id = ?;', [id]);
        console.log('Query executed');
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.error("Database error:", err);
        throw err;
    } finally {
        if (conn) {
            try {
                console.log('Releasing database connection');
                await conn.release();
                console.log('Database connection released');
            } catch (releaseErr) {
                console.error('Error releasing database connection:', releaseErr);
            }
        }
    }
}

/// Search for user by their username and then pass the user row object (json)
/// to the cb function. The user row has three keys: {"UserID":"", "Username", "Password"}
async function findByUsername(username) {
    let conn;
    try {
        console.log(`Finding user by username: ${username}`);
        conn = await getDBConnection();
        const rows = await conn.query('SELECT * FROM users WHERE username = ?;', [username]);
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.error("Database error:", err);
        throw err;
    } finally {
        if (conn) {
            try {
                await conn.release();
            } catch (releaseErr) {
                console.error('Error releasing database connection:', releaseErr);
            }
        }
    }
}

// Define exports
// module.exports.register = register;
// module.exports.strategy = strategy;
// module.exports.findById = findById;
// module.exports.findByUsername = findByUsername;

export default users;