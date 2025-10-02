import dotenv from 'dotenv';
import mariadb, { Pool, PoolConnection } from 'mariadb';
import { logger } from './logger';

dotenv.config();

// Define the configuration for the database connection pool in one place.
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'groupify',
  password: process.env.DB_PASSWORD || 'groupify',
  database: process.env.DB_NAME || 'groupify',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  connectionLimit: 20,      // Max number of connections in the pool
  acquireTimeout: 30000,    // 30 seconds to wait for a connection before timing out
  waitForConnections: true, // Wait for a connection if all are in use (prevents errors on load)
  queueLimit: 0,            // No limit on the number of waiting requests
};

/**
 * A singleton instance of the MariaDB connection pool.
 * This ensures that only one pool is created and shared across the entire application,
 * which is critical for performance and stability, especially in a hot-reloading environment.
 */
let pool: Pool;

function getPool(): Pool {
  if (!pool) {
    logger.log('Creating new MariaDB connection pool...');
    pool = mariadb.createPool(dbConfig);
  }
  return pool;
}

/**
 * Acquires a database connection from the pool.
 *
 * IMPORTANT: You MUST release the connection back to the pool when you are done with it.
 * The best practice is to use a `finally` block to ensure the connection is always released,
 * even if an error occurs.
 *
 * @example
 * let conn;
 * try {
 *   conn = await getDBConnection();
 *   const rows = await conn.query("SELECT * FROM users");
 *   // ... do something with rows
 * } catch (err) {
 *   console.error(err);
 * } finally {
 *   if (conn) await conn.release();
 * }
 */

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;
let dbInitError: Error | null = null;







export async function getDBConnection(): Promise<PoolConnection> {
  try {
    const connection = await getPool().getConnection();
    return connection;
  } catch (err) {
    logger.error('Failed to get DB connection from pool:', err);
    // Rethrow the error so the calling function knows something went wrong.
    throw err;
  }
}

async function checkDatabaseExists(conn: PoolConnection): Promise<boolean> {
  try {
    const result = await conn.query(`
      SELECT SCHEMA_NAME 
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = ?
    `, [dbConfig.database]);
    return result.length > 0;
  } catch (err) {
    logger.error('Error checking database existence:', err);
    return false;
  }
}

async function checkTablesExist(conn: PoolConnection): Promise<boolean> {
  try {
    const result = await conn.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name IN ('users', 'tracks', 'votes', 'playlists', 'playlist_tracks', 'playlist_users')
    `, [dbConfig.database]);
    return result[0].count === 6;
  } catch (err) {
    logger.error('Error checking tables existence:', err);
    return false;
  }
}

export async function initializeDatabase(force: boolean = false): Promise<void> {
  logger.log('Checking database initialization');
  
  // If we've already initialized successfully, don't reinitialize unless forced
  if (!force && dbInitialized) {
    logger.log('Database already initialized, skipping initialization');
    return;
  }

  // If we have a pending initialization, wait for it
  if (dbInitPromise) {
    logger.log('Waiting for pending initialization');
    await dbInitPromise;
    return;
  }

  // If we had a previous initialization error and we're not forcing, don't retry
  if (!force && dbInitError) {
    logger.log('Previous initialization failed, skipping initialization');
    throw dbInitError;
  }

  dbInitPromise = (async () => {
    let conn: PoolConnection | undefined;
    try {
      conn = await getDBConnection();
      logger.log('Connected to database');

      // Check if database and tables exist
      const dbExists = await checkDatabaseExists(conn);
      if (dbExists) {
        await conn.query(`USE ${dbConfig.database}`);
        const tablesExist = await checkTablesExist(conn);
        if (tablesExist && !force) {
          logger.log('Database and tables already exist, skipping initialization');
          dbInitialized = true;
          dbInitError = null;
          return;
        }
      }

      // If we get here, either the database doesn't exist or we're forcing initialization
      logger.log('Initializing database...');
      await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      await conn.query(`USE ${dbConfig.database}`);

      // Disable foreign key checks before dropping tables
      await conn.query('SET FOREIGN_KEY_CHECKS=0');
      await conn.query('DROP TABLE IF EXISTS playlist_tracks');
      await conn.query('DROP TABLE IF EXISTS users');
      await conn.query('DROP TABLE IF EXISTS playlists');
      await conn.query('DROP TABLE IF EXISTS votes');
      await conn.query('DROP TABLE IF EXISTS tracks');
      await conn.query('DROP TABLE IF EXISTS playlist_users');
      logger.log('Dropped existing tables');
      // Recreate the tables; Re-enable foreign key checks
      await conn.query('SET FOREIGN_KEY_CHECKS=1');

      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
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

      /* add a playlist field later? Unique constraint?*/
      await conn.query(`
        CREATE TABLE IF NOT EXISTS tracks (
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
        CREATE TABLE IF NOT EXISTS votes (
          id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
          TrackID VARCHAR(22),
          UserID INT NOT NULL,
          VoteType ENUM('upvote', 'downvote', 'neutral') NOT NULL,
          FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (TrackID) REFERENCES tracks(SpotifyID) ON DELETE CASCADE
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS playlists (
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
        INSERT IGNORE INTO playlists (PlaylistID, name, Description, created_by)
        VALUES (1, 'Default Playlist', 'This is the default playlist.', 1)
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS playlist_tracks (
          PlaylistTrackID INT AUTO_INCREMENT PRIMARY KEY,
          PlaylistID INT DEFAULT 1 NOT NULL,
          TrackID VARCHAR(22),
          FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
          FOREIGN KEY (TrackID) REFERENCES tracks(SpotifyID) ON DELETE CASCADE,
          UNIQUE (PlaylistID, TrackID)
        )
      `);

      await conn.query(`
        ALTER TABLE votes
        ADD PlaylistID INT DEFAULT 1,
        ADD FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        ADD UNIQUE (PlaylistID, TrackID, UserID)
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS playlist_users (
          PlaylistUserID INT AUTO_INCREMENT PRIMARY KEY,
          PlaylistID INT DEFAULT 1 NOT NULL,
          UserID INT NOT NULL,
          Joined BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
          FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE (PlaylistID, UserID)
        )
        
        `)

      dbInitialized = true;
      dbInitError = null;
      logger.log('Database initialized successfully!');
    } catch (err) {
      logger.error("Error initializing database:", err);
      dbInitError = err as Error;
      throw err;
    } finally {
      if (conn) await conn.release();
      dbInitPromise = null;
    }
  })();

  try {
  await dbInitPromise;
  } catch (err) {
    // Don't rethrow the error, just log it
    logger.error('Database initialization failed:', err);
  }
}

export async function findUserByUsername(username: string): Promise<object | null> {
  let conn: PoolConnection | undefined;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    logger.error('Database error:', err);
    return null;
  } finally {
    if (conn) await conn.release();
  }
}
