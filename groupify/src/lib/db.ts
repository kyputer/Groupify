import dotenv from 'dotenv';
import mariadb, { PoolConnection } from "mariadb";

dotenv.config();

const dbName: string = process.env.DB_NAME || 'groupify';

export const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'groupify',
  password: 'groupify',
  database: 'groupify',
  port: 3306,
  connectionLimit: 20,
  multipleStatements: true,
  acquireTimeout: 20000,
  waitForConnections: true
});

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

export async function getDBConnection(): Promise<PoolConnection> {
  let connection: PoolConnection;
  try {
    connection = await pool.getConnection();
    if (dbInitialized) {
      await connection.query(`USE ${dbName}`);
    }
    return connection;
  } catch (err) {
    console.error("Error retrieving a connection from the pool:", err);
    throw err;
  }
}

export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database');
  if (dbInitialized) return;
  if (dbInitPromise) {
    await dbInitPromise;
    return;
  }

  dbInitPromise = (async () => {
    let conn: PoolConnection | undefined;
    try {
      conn = await getDBConnection();

      await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
      await conn.query(`USE ${process.env.DB_NAME}`);

      await conn.query('SET FOREIGN_KEY_CHECKS=0');
      await conn.query('DROP TABLE IF EXISTS playlist_tracks');
      await conn.query('DROP TABLE IF EXISTS users');
      await conn.query('DROP TABLE IF EXISTS playlists');
      await conn.query('DROP TABLE IF EXISTS votes');
      await conn.query('DROP TABLE IF EXISTS vote');
      await conn.query('DROP TABLE IF EXISTS tracks');
      await conn.query('SET FOREIGN_KEY_CHECKS=1');

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
          Play BOOLEAN NOT NULL DEFAULT 0,
          VoteType ENUM('upvote', 'downvote') NOT NULL,
          FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (TrackID) REFERENCES tracks(id) ON DELETE CASCADE
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS playlists (
          PlaylistID INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          Description TEXT DEFAULT NULL,
          user_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await conn.query(`
        INSERT IGNORE INTO playlists (PlaylistID, name, Description, user_id)
        VALUES (1, 'Default Playlist', 'This is the default playlist.', 1)
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS playlist_tracks (
          PlaylistTrackID INT AUTO_INCREMENT PRIMARY KEY,
          PlaylistID INT DEFAULT 1 NOT NULL,
          TrackID INT NOT NULL,
          FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
          FOREIGN KEY (TrackID) REFERENCES tracks(id) ON DELETE CASCADE,
          UNIQUE (PlaylistID, TrackID)
        )
      `);

      await conn.query(`
        ALTER TABLE votes
        ADD PlaylistID INT DEFAULT 1,
        ADD FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        ADD UNIQUE (PlaylistID, TrackID, UserID)
      `);

      dbInitialized = true;
      console.log('db.ts init done!');
    } catch (err) {
      console.error("Error initializing database:", err);
      throw err;
    } finally {
      if (conn) await conn.release();
    }
  })();

  await dbInitPromise;
}

export async function findUserByUsername(username: string): Promise<any | null> {
  let conn: PoolConnection | undefined;
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
