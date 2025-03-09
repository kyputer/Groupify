import dotenv from 'dotenv';
import mariadb from "mariadb";

dotenv.config();

const dbName = process.env.DB_NAME || 'groupify';

export const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'groupify',
  password: 'groupify',
  database: 'groupify',
  port: 3306,
  connectionLimit: 20, // Increase this if needed
  multipleStatements: true,
  acquireTimeout: 20000, // Wait longer before timing out
  waitForConnections: true // Ensures pool does not reject immediately
});

// This flag will be set to true once the database is built/initialized.
let dbInitialized = false;
let dbInitPromise = null;



// export function attemptConnection() {
//    pool.getConnection((err, connection) => {
//     if (err) {
//       console.log('error connecting. retrying in 1 sec');
//       setTimeout(attemptConnection, 1000);
//     } else {
//       connection.query, (errQuery, results) => {
//         connection.release();
//         if (errQuery) {
//           console.log('Error querying database!');
//         } else {
//           console.log('Successfully queried database.');
//         }
//       }
//     }
//   });
// }

/**
 * Returns a pool connection. If the database has been built, then it will
 * automatically select the database.
 * (Remember: The caller is responsible for releasing the connection.)
 */
export async function getDBConnection() {
  console.log('Getting database connection');
  let connection;
  try {
    connection = await pool.getConnection();
    // If the database has been initialized, select it on the connection.
    if (dbInitialized) {
      await connection.query(`USE ${dbName}`);
    }
    return connection;
  } catch (err) {
    console.error("Error retrieving a connection from the pool:", err);
    throw err;
  }
}

export async function initializeDatabase() {
  console.log('Initializing database');
  // If already initialized, just return.
  if (dbInitialized) return;
  // If an initialization is already in progress, wait on it.
  if (dbInitPromise) {
    await dbInitPromise;
    return;
  }
  // Otherwise, start the initialization process.
  dbInitPromise = (async () => {
  let conn;
  try {
    conn = await getDBConnection();

    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await conn.query(`USE ${process.env.DB_NAME}`);

    // Drop tables in the correct order to avoid foreign key constraint issues
    await conn.query('DROP TABLE IF EXISTS playlist_tracks');
    await conn.query('DROP TABLE IF EXISTS playlists');
    await conn.query('DROP TABLE IF EXISTS votes');
    await conn.query('DROP TABLE IF EXISTS vote');
    await conn.query('DROP TABLE IF EXISTS tracks');
    await conn.query('DROP TABLE IF EXISTS users');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS tracks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        SpotifyID VARCHAR(22) NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        user_id INT,
        blacklist INT DEFAULT NULL,
        votes INT DEFAULT 1, 
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        TrackID INT NOT NULL,
        UserID INT NOT NULL,
        Play BOOLEAN NOT NULL default 0,
        VoteType ENUM('upvote', 'downvote') NOT NULL,
        UNIQUE (TrackID, UserID),
        FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (TrackID) REFERENCES tracks(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id INT NOT NULL,
        track_id INT NOT NULL,
        PRIMARY KEY (playlist_id, track_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
      )
    `);
    dbInitialized = true;
    // After successfully creating the database and tables:
    console.log('db.js init done!')
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  } finally {
    if (conn) await conn.release();
  }
})();
await dbInitPromise;
}

// Function to find a user by username
export async function findUserByUsername(username) {
    let conn;
    try {
      conn = await getDBConnection();
      const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error("Database error:", err);
      return null;
    } finally {
      if (conn) await conn.release();
    }
  }
  
  // Export functions
/*module.export = { 
	  pool, initializeDatabase, findUserByUsername
};*/
