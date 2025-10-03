import dotenv from 'dotenv';
import mariadb, { Pool, PoolConnection } from 'mariadb';
import { logger } from './logger';

dotenv.config();

// Production-optimized connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'groupify',
  password: process.env.DB_PASSWORD || 'groupify',
  database: process.env.DB_NAME || 'groupify',
  port: parseInt(process.env.DB_PORT || '3306', 10),

  // Ultra-lean production settings
  connectionLimit: process.env.NODE_ENV === 'production' ? 2 : 5, // Minimal connections in prod
  acquireTimeout: 8000, // 8s timeout
  timeout: 5000, // 5s query timeout
  idleTimeout: 120000, // 2 minutes idle (longer to avoid reconnection overhead)
  leakDetectionTimeout: 0, // Disable in production to reduce overhead

  // Connection efficiency settings
  reconnect: true,
  maxReconnects: 2, // Fewer retries in prod
  multipleStatements: false,
  nestTables: false,
  rowsAsArray: false,
  compress: process.env.NODE_ENV === 'production', // Enable compression in prod
  permitLocalInfile: false,

  // Keep connections alive longer in production
  pingInterval: process.env.NODE_ENV === 'production' ? 300000 : 60000, // 5min in prod, 1min in dev
  resetAfterUse: false, // Disable in production for better performance

  // Production connection optimization
  autoReconnect: true,
  maxIdle: process.env.NODE_ENV === 'production' ? 1 : 3, // Minimal idle connections
  minIdle: process.env.NODE_ENV === 'production' ? 0 : 1, // No minimum in prod

  // Additional production optimizations
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  timezone: 'Z',

  // Connection validation (minimal in production)
  acquireCallback:
    process.env.NODE_ENV === 'development'
      ? (err: Error | null) => {
          if (err) logger.error('Connection acquire error:', err.message);
        }
      : undefined,
};

let pool: Pool;
let isShuttingDown = false;

function createPool(): Pool {
  if (isShuttingDown) {
    throw new Error('Database pool is shutting down');
  }

  const newPool = mariadb.createPool(dbConfig);

  // Add minimal error handling
  if (process.env.NODE_ENV === 'development') {
    newPool.on('error', (err: Error) => {
      logger.error('Pool error:', err.message);
    });
  }

  return newPool;
}

// Initialize pool
pool = createPool();

// Optimized pool recreation (rarely needed in production)
export function recreatePool(): void {
  if (isShuttingDown) return;

  const oldPool = pool;
  pool = createPool();

  // Close old pool asynchronously to avoid blocking
  oldPool?.end().catch(err => {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Error closing old pool:', err.message);
    }
  });

  logger.log('Database connection pool recreated');
}

/**
 * Production-optimized connection management
 */
export async function getDBConnection(): Promise<PoolConnection> {
  if (isShuttingDown) {
    throw new Error('Database service is shutting down');
  }

  let retries = process.env.NODE_ENV === 'production' ? 2 : 3;

  while (retries > 0) {
    try {
      const connection = await pool.getConnection();

      // Minimal event handlers only in development
      if (process.env.NODE_ENV === 'development') {
        connection.on('error', (err: Error) => {
          logger.error('Connection error:', err.message);
        });
      }

      return connection;
    } catch (err) {
      retries--;
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      if (process.env.NODE_ENV === 'development') {
        logger.error(
          `Failed to get DB connection (${retries} retries left):`,
          errorMsg
        );
      }

      if (retries === 0) {
        // Only recreate pool in development or critical production errors
        if (
          process.env.NODE_ENV === 'development' ||
          errorMsg.includes('ECONNREFUSED')
        ) {
          try {
            recreatePool();
            return await pool.getConnection();
          } catch (finalErr) {
            throw new Error(`Database connection failed: ${errorMsg}`);
          }
        }
        throw new Error(`Database connection failed: ${errorMsg}`);
      }

      // Shorter retry delay in production
      const delay = process.env.NODE_ENV === 'production' ? 500 : 1000;
      await new Promise(resolve => setTimeout(resolve, delay * (3 - retries)));
    }
  }

  throw new Error('Database connection failed after all retries');
}

/**
 * Production-optimized query execution
 */
export async function executeQuery<T = unknown>(
  query: string,
  params: unknown[] = []
): Promise<T> {
  let conn: PoolConnection | undefined;

  try {
    conn = await getDBConnection();
    const result = await conn.query(query, params);
    return result;
  } catch (error) {
    // Minimal logging in production
    if (process.env.NODE_ENV === 'development') {
      logger.error('Query execution error:', {
        query: query.substring(0, 100) + '...',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    throw error;
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseError) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error releasing connection:', releaseError);
        }
      }
    }
  }
}

/**
 * Production-optimized transaction execution
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
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error during rollback:', rollbackError);
        }
      }
    }
    throw error;
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (releaseError) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error releasing connection:', releaseError);
        }
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
  logger.log('Database initialization triggered with force:', force);

  return executeTransaction(async conn => {
    logger.log('Database connection acquired for initialization');

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

    // Recreate all tables with optimized schema
    await conn.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        spotify_refresh_token VARCHAR(512),
        spotify_access_token VARCHAR(512), 
        spotify_access_token_expires_at BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      ) AUTO_INCREMENT = 1 ENGINE=InnoDB
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_spotify_id (SpotifyID),
        INDEX idx_votes (votes),
        INDEX idx_queue_at (queue_at)
      ) AUTO_INCREMENT = 1 ENGINE=InnoDB
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
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_code (code),
        INDEX idx_created_by (created_by)
      ) AUTO_INCREMENT = 1 ENGINE=InnoDB
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
        UNIQUE KEY unique_vote (PlaylistID, TrackID, UserID),
        INDEX idx_track_playlist (TrackID, PlaylistID)
      ) AUTO_INCREMENT = 1 ENGINE=InnoDB
    `);
    logger.log('Votes table created');

    await conn.query(`
      CREATE TABLE playlist_tracks (
        PlaylistTrackID INT AUTO_INCREMENT PRIMARY KEY,
        PlaylistID INT NOT NULL,
        TrackID VARCHAR(22),
        FOREIGN KEY (PlaylistID) REFERENCES playlists(PlaylistID) ON DELETE CASCADE,
        FOREIGN KEY (TrackID) REFERENCES tracks(SpotifyID) ON DELETE CASCADE,
        UNIQUE KEY unique_playlist_track (PlaylistID, TrackID)
      ) AUTO_INCREMENT = 1 ENGINE=InnoDB
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
        UNIQUE KEY unique_playlist_user (PlaylistID, UserID)
      ) AUTO_INCREMENT = 1 ENGINE=InnoDB
    `);
    logger.log('Playlist_users table created');

    logger.log('Database initialization completed successfully!');
  });
}

// Production-safe monitoring and cleanup
if (typeof window === 'undefined') {
  // Only enable monitoring in development
  if (process.env.NODE_ENV === 'development') {
    const monitoringInterval = setInterval(() => {
      if (pool && !isShuttingDown) {
        console.log('DB Pool Stats:', {
          totalConnections: pool.totalConnections(),
          activeConnections: pool.activeConnections(),
          idleConnections: pool.idleConnections(),
        });
      }
    }, 120000); // Every 2 minutes in development

    // Clear interval on shutdown
    const clearMonitoring = () => {
      clearInterval(monitoringInterval);
    };

    process.on('SIGTERM', clearMonitoring);
    process.on('SIGINT', clearMonitoring);
  }

  // Production-safe graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.log(`Received ${signal}, shutting down database pool...`);

    if (pool) {
      try {
        await pool.end();
        logger.log('Database pool closed successfully');
      } catch (error) {
        logger.error('Error closing database pool:', error);
      }
    }

    // Exit gracefully
    process.exit(0);
  };

  // Only attach to actual shutdown signals (not beforeExit!)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    logger.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', reason => {
    logger.error('Unhandled rejection:', reason);
    gracefulShutdown('unhandledRejection');
  });
}
