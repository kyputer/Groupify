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
  acquireTimeout: 20000,
  waitForConnections: true,
});

let dbInitialized = false;

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
    throw err;
  }
}

export async function initializeDatabase(): Promise<void> {
  if (dbInitialized) return;

  let conn: PoolConnection | undefined;
  try {
    conn = await pool.getConnection();
    console.log('Connected to database');
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await conn.query(`USE ${dbName}`);
    dbInitialized = true;
    console.log('Database initialized successfully!');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    if (conn) await conn.release();
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

// Automatically initialize the database when this module is loaded
(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized on module load');
  } catch (err) {
    console.error('Failed to initialize database on module load:', err);
  }
})();
