import dotenv from 'dotenv';
import mariadb, { PoolConnection } from 'mariadb';

dotenv.config();

const dbName: string = process.env.DB_NAME || 'groupify';
const dbUser: string = process.env.DB_USER || 'groupify';
const dbPassword: string = process.env.DB_PASSWORD || 'groupify';
const dbHost: string = process.env.DB_HOST || '127.0.0.1';
const dbPort: number = parseInt(process.env.DB_PORT || '3306', 10);

export const pool = mariadb.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  connectionLimit: 20,
  multipleStatements: true,
  acquireTimeout: 20000
});

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;
let dbInitError: Error | null = null;

export async function getDBConnection(): Promise<PoolConnection> {
  let connection: PoolConnection;
  try {
    connection = await pool.getConnection();
    if (dbInitialized) {
      await connection.query(`USE ${dbName}`);
    }
    return connection;
  } catch (err) {
    console.error('Error retrieving a connection from the pool:', err);
    // Don't reinitialize on connection errors
    throw err;
  }
}

async function checkDatabaseExists(conn: PoolConnection): Promise<boolean> {
  try {
    const result = await conn.query(`
      SELECT SCHEMA_NAME 
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME = ?
    `, [dbName]);
    return result.length > 0;
  } catch (err) {
    console.error('Error checking database existence:', err);
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
    `, [dbName]);
    return result[0].count === 6;
  } catch (err) {
    console.error('Error checking tables existence:', err);
    return false;
  }
}

export async function initializeDatabase(force: boolean = false): Promise<void> {
  console.log('Checking database initialization');
  
  // If we've already initialized successfully, don't reinitialize unless forced
  if (!force && dbInitialized) {
    console.log('Database already initialized, skipping initialization');
    return;
  }

  // If we have a pending initialization, wait for it
  if (dbInitPromise) {
    console.log('Waiting for pending initialization');
    await dbInitPromise;
    return;
  }

  // If we had a previous initialization error and we're not forcing, don't retry
  if (!force && dbInitError) {
    console.log('Previous initialization failed, skipping initialization');
    throw dbInitError;
  }

  dbInitPromise = (async () => {
    let conn: PoolConnection | undefined;
    try {
      conn = await getDBConnection();
      console.log('Connected to database');

      // Check if database and tables exist
      const dbExists = await checkDatabaseExists(conn);
      if (dbExists) {
        await conn.query(`USE ${dbName}`);
        const tablesExist = await checkTablesExist(conn);
        if (tablesExist && !force) {
          console.log('Database and tables already exist, skipping initialization');
          dbInitialized = true;
          dbInitError = null;
          return;
        }
      }

      // If we get here, either the database doesn't exist or we're forcing initialization
      console.log('Initializing database...');
      await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
      await conn.query(`USE ${dbName}`);

      // Disable foreign key checks before dropping tables
      await conn.query('SET FOREIGN_KEY_CHECKS=0');
      await conn.query('DROP TABLE IF EXISTS playlist_tracks');
      await conn.query('DROP TABLE IF EXISTS users');
      await conn.query('DROP TABLE IF EXISTS playlists');
      await conn.query('DROP TABLE IF EXISTS votes');
      await conn.query('DROP TABLE IF EXISTS tracks');
      await conn.query('DROP TABLE IF EXISTS playlist_users');
      console.log('Dropped existing tables');
      // Recreate the tables; Re-enable foreign key checks
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
          TrackID INT NOT NULL,
          UserID INT NOT NULL,
          VoteType ENUM('upvote', 'downvote', 'neutral') NOT NULL,
          FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (TrackID) REFERENCES tracks(id) ON DELETE CASCADE
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
      console.log('Database initialized successfully!');
    } catch (err) {
      console.error("Error initializing database:", err);
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
    console.error('Database initialization failed:', err);
  }
}

export async function findUserByUsername(username: string): Promise<any | null> {
  let conn: PoolConnection | undefined;
  try {
    conn = await getDBConnection();
    const rows = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Database error:', err);
    return null;
  } finally {
    if (conn) await conn.release();
  }
}
