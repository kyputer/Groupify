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

  // Connection reliability settings
  reconnect: true,
  maxReconnects: 3,

  // Additional settings to prevent aborted connections
  multipleStatements: false, // Disable for security
  nestTables: false,
  rowsAsArray: false,

  // MariaDB specific optimizations
  compress: false,
  permitLocalInfile: false,

  // Connection validation
  pingInterval: 60000, // Ping every minute to keep connections alive
  resetAfterUse: true, // Reset connection state after each use

  // Prevent connection drops
  autoReconnect: true,
  maxIdle: 5, // Maximum idle connections
  minIdle: 2, // Minimum idle connections
};

// Create pool with better error handling
let pool: Pool;

function createPool(): Pool {
  return mariadb.createPool({
    ...dbConfig,
    // Enhanced error handling
    acquireTimeout: 30000,
    timeout: 15000,
    // Add connection event handlers
    acquireCallback: (err: Error | null, conn?: PoolConnection) => {
      if (err) {
        logger.error('Connection acquire error:', err.message);
      }
    },
  });
}

// Initialize pool
pool = createPool();

// Function to recreate the pool (useful after reset)
export function recreatePool(): void {
  if (pool) {
    pool.end().catch(err => {
      logger.warn('Error closing old pool:', err.message);
    });
  }
  pool = createPool();
  logger.log('Database connection pool recreated');
}

/**
 * Enhanced connection management with comprehensive error handling
 */
export async function getDBConnection(): Promise<PoolConnection> {
  let retries = 3;

  while (retries > 0) {
    try {
      const connection = await pool.getConnection();

      // Add connection event handlers for better debugging
      if (process.env.NODE_ENV === 'development') {
        connection.on('error', (err: Error) => {
          logger.error('Connection error:', err.message);
        });

        connection.on('end', () => {
          if (process.env.NODE_ENV === 'development') {
            logger.log('Connection ended gracefully');
          }
        });
      }

      return connection;
    } catch (err) {
      retries--;
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error(
        `Failed to get DB connection (${retries} retries left):`,
        errorMsg
      );

      if (retries === 0) {
        // Last retry failed, recreate pool and try once more
        try {
          recreatePool();
          return await pool.getConnection();
        } catch (finalErr) {
          logger.error('Final connection attempt failed:', finalErr);
          throw new Error(
            `Database connection failed after retries: ${errorMsg}`
          );
        }
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
    }
  }

  throw new Error('Database connection failed after all retries');
}

/**
 * Execute query with automatic connection management
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T> {
  let conn: PoolConnection | undefined;

  try {
    conn = await getDBConnection();
    const result = await conn.query(query, params);
    return result;
  } catch (error) {
    logger.error('Query execution error:', {
      query: query.substring(0, 100) + '...', // Log first 100 chars
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseError) {
        logger.error('Error releasing connection:', releaseError);
      }
    }
  }
}

/**
 * Execute transaction with automatic rollback on error
 */
export async function executeTransaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  let conn: PoolConnection | undefined;

  try {
    conn = await getDBConnection();
    await conn.beginTransaction();

    const result = await callback(conn);

    await conn.commit();
    return result;
  } catch (error) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        logger.error('Error during rollback:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseError) {
        logger.error('Error releasing connection:', releaseError);
      }
    }
  }
}

/**
 * Enhanced database initialization with proper connection management
 */
export async function initializeDatabase(
  force: boolean = false
): Promise<void> {
  logger.log('Manual database initialization triggered with force:', force);

  return executeTransaction(async conn => {
    logger.log('Database connection acquired for reset');

    // Create database if it doesn't exist
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await conn.query(`USE ${dbConfig.database}`);

    // Disable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS=0');

    // Drop tables in correct order
    const tablesToDrop = [
      'playlist_tracks',
      'playlist_users',
      'votes',
      'tracks',
      'playlists',
      'users',
    ];

    for (const table of tablesToDrop) {
      try {
        await conn.query(`DROP TABLE IF EXISTS ${table}`);
        logger.log(`Dropped table: ${table}`);
      } catch (dropError) {
        logger.log(`Warning: Could not drop table ${table}:`, dropError);
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    logger.log('All tables dropped successfully');

    // Recreate all tables
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
      ) AUTO_INCREMENT = 1
    `);
    logger.log('Users table created');

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
      ) AUTO_INCREMENT = 1
    `);
    logger.log('Tracks table created');

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
        spotify_url VARCHAR(500) DEFAULT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) AUTO_INCREMENT = 1
    `);
    logger.log('Playlists table created');

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
      ) AUTO_INCREMENT = 1
    `);
    logger.log('Votes table created');

    await conn.query(`
      CREATE TABLE playlist_tracks (
        PlaylistTrackID INT AUTO_INCREMENT PRIMARY KEY,
        PlaylistID INT NOT NULL,
        TrackID VARCHAR(22),
        FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        FOREIGN KEY (TrackID) REFERENCES tracks(SpotifyID) ON DELETE CASCADE,
        UNIQUE (PlaylistID, TrackID)
      ) AUTO_INCREMENT = 1
    `);
    logger.log('Playlist_tracks table created');

    await conn.query(`
      CREATE TABLE playlist_users (
        PlaylistUserID INT AUTO_INCREMENT PRIMARY KEY,
        PlaylistID INT NOT NULL,
        UserID INT NOT NULL,
        Joined BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (PlaylistID, UserID)
      ) AUTO_INCREMENT = 1
    `);
    logger.log('Playlist_users table created');

    logger.log('All tables recreated with reset AUTO_INCREMENT');
    logger.log('Database reset completed successfully!');
  });
}

// Pool monitoring and cleanup
if (typeof window === 'undefined') {
  // Server-side only: Set up periodic pool monitoring
  setInterval(() => {
    if (pool && process.env.NODE_ENV === 'development') {
      // Log pool statistics periodically
      console.log('DB Pool Stats:', {
        totalConnections: pool.totalConnections(),
        activeConnections: pool.activeConnections(),
        idleConnections: pool.idleConnections(),
      });
    }
  }, 60000); // Every minute

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.log('Shutting down database pool...');
    if (pool) {
      try {
        await pool.end();
        logger.log('Database pool closed successfully');
      } catch (error) {
        logger.error('Error closing database pool:', error);
      }
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('beforeExit', gracefulShutdown);
}
