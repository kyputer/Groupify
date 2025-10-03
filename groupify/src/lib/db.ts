import dotenv from 'dotenv';
import mariadb, { Pool, PoolConnection } from 'mariadb';
import { logger } from './logger';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'groupify',
  password: process.env.DB_PASSWORD || 'groupify',
  database: process.env.DB_NAME || 'groupify',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  connectionLimit: 5, // Reduced from 10 - fewer connections
  acquireTimeout: 10000, // Reduced from 30s - fail faster
  timeout: 5000, // 5s query timeout
  idleTimeout: 30000, // 30s idle timeout
  leakDetectionTimeout: 60000, // 60s leak detection
  waitForConnections: true,
  queueLimit: 0,
  multipleStatements: true,
};

// Create pool immediately at module load
const pool: Pool = mariadb.createPool(dbConfig);

/**
 * Acquires a database connection from the pool.
 * IMPORTANT: Always release with conn.release() in a finally block.
 */
export async function getDBConnection(): Promise<PoolConnection> {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (err) {
    logger.error('Failed to get DB connection from pool:', err);
    throw err;
  }
}

/**
 * Manual database initialization - only called when reset button is clicked
 */
export async function initializeDatabase(
  force: boolean = false
): Promise<void> {
  logger.log('Manual database initialization triggered');

  let conn: PoolConnection | undefined;
  try {
    conn = await getDBConnection();

    await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await conn.query(`USE ${dbConfig.database}`);

    // Disable foreign key checks and drop tables
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    await conn.query('DROP TABLE IF EXISTS playlist_tracks');
    await conn.query('DROP TABLE IF EXISTS playlist_users');
    await conn.query('DROP TABLE IF EXISTS votes');
    await conn.query('DROP TABLE IF EXISTS tracks');
    await conn.query('DROP TABLE IF EXISTS playlists');
    await conn.query('DROP TABLE IF EXISTS users');
    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    // Recreate tables
    await conn.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        spotify_refresh_token VARCHAR(512),
        spotify_access_token VARCHAR(512),
        spotify_access_token_expires_at BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE tracks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        SpotifyID VARCHAR(22) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        url VARCHAR(255) NOT NULL,
        image VARCHAR(255) NOT NULL,
        user_id INT,
        blacklist INT DEFAULT NULL,
        votes INT DEFAULT 1,
        duration_ms INT NOT NULL,
        explicit BOOLEAN DEFAULT FALSE,
        queued BOOLEAN DEFAULT FALSE,
        queue_at TIMESTAMP DEFAULT NULL,
        played BOOLEAN DEFAULT FALSE,
        played_at TIMESTAMP DEFAULT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE playlists (
        PlaylistID INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(8) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT NOT NULL,
        is_public BOOLEAN DEFAULT TRUE,
        description TEXT DEFAULT NULL,
        open BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE votes (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        TrackID VARCHAR(22),
        UserID INT NOT NULL,
        VoteType ENUM('upvote', 'downvote', 'neutral') NOT NULL,
        PlaylistID INT NOT NULL DEFAULT 1,
        FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (TrackID) REFERENCES tracks(SpotifyID) ON DELETE CASCADE,
        FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        UNIQUE (PlaylistID, TrackID, UserID)
      )
    `);

    await conn.query(`
      CREATE TABLE playlist_tracks (
        PlaylistTrackID INT AUTO_INCREMENT PRIMARY KEY,
        PlaylistID INT NOT NULL,
        TrackID VARCHAR(22),
        FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        FOREIGN KEY (TrackID) REFERENCES tracks(SpotifyID) ON DELETE CASCADE,
        UNIQUE (PlaylistID, TrackID)
      )
    `);

    await conn.query(`
      CREATE TABLE playlist_users (
        PlaylistUserID INT AUTO_INCREMENT PRIMARY KEY,
        PlaylistID INT NOT NULL,
        UserID INT NOT NULL,
        Joined BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (PlaylistID, UserID)
      )
    `);

    logger.log('Database initialized successfully!');
  } catch (err) {
    logger.error('Error initializing database:', err);
    throw err;
  } finally {
    if (conn) await conn.release();
  }
}
